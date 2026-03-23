import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import FileStoreFactory from "session-file-store";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { sendVerificationEmail } from "./email";

const FileStore = FileStoreFactory(session);

export function setupAuth(app: Express) {
  const connectionString = process.env.DATABASE_URL;

  let sessionStore: any;
  if (connectionString) {
    try {
      sessionStore = new (connectPg(session))({
        conString: connectionString,
        createTableIfMissing: true,
        tableName: "session",
        ttl: 7 * 24 * 60 * 60,
      });
    } catch {
      // fall through to file store
    }
  }
  if (!sessionStore) {
    const sessionsDir = join(process.cwd(), "data", "sessions");
    if (!existsSync(sessionsDir)) mkdirSync(sessionsDir, { recursive: true });
    sessionStore = new FileStore({
      path: sessionsDir,
      ttl: 7 * 24 * 60 * 60,
      retries: 1,
      logFn: () => {},
    });
    console.log("✓ Using file-based session storage (data/sessions).");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "forus-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: sessionStore,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // ─── Local strategy (email + password) ────────────────────────────────────
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase().trim());
        if (!user) return done(null, false, { message: "No account found with that email." });
        if (!user.passwordHash) return done(null, false, { message: "Please log in with the method you used to create your account." });
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return done(null, false, { message: "Incorrect password." });
        if (!user.emailVerified) return done(null, false, { message: "Please verify your email before logging in." });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // ─── Google OAuth ──────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const domain = process.env.REPLIT_DOMAINS || `${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`;
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `https://${domain}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
            if (!user) {
              user = await storage.createUser({
                username: profile.displayName || profile.emails?.[0]?.value?.split("@")[0] || "user",
                email: profile.emails?.[0]?.value || "",
                password: null,
                passwordHash: null,
                provider: "google",
                providerId: profile.id,
                displayName: profile.displayName || null,
                birthDate: null,
              });
            }
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch {
      done(null, false);
    }
  });

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, birthDate } = req.body;

      if (!name?.trim() || !email?.trim() || !password || !birthDate) {
        return res.status(400).json({ message: "All fields are required." });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await storage.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await storage.createUser({
        username: name.trim(),
        email: normalizedEmail,
        password: null,
        passwordHash,
        provider: "local",
        providerId: null,
        displayName: name.trim(),
        birthDate,
      });

      // Generate verification token (expires in 24h)
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createVerificationToken(user.id, token, expiresAt);

      // Build base URL from the incoming request — works in any environment
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
      const baseUrl = `${proto}://${host}`;

      const result = await sendVerificationEmail(normalizedEmail, name.trim(), token, baseUrl);

      res.status(201).json({
        message: "Account created! Please check your email to verify your account.",
        devVerifyUrl: result.sent ? undefined : result.devUrl,
      });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // ─── VERIFY EMAIL ─────────────────────────────────────────────────────────
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ message: "Invalid verification link." });

      const record = await storage.getVerificationToken(token);
      if (!record) return res.status(400).json({ message: "Verification link is invalid or has already been used." });
      if (new Date() > record.expiresAt) {
        await storage.deleteVerificationToken(token);
        return res.status(400).json({ message: "Verification link has expired. Please register again." });
      }

      await storage.updateUser(record.userId, { emailVerified: true });
      await storage.deleteVerificationToken(token);

      // Redirect to login with success flag
      res.redirect("/start?verified=1");
    } catch (err) {
      console.error("Verify email error:", err);
      res.status(500).json({ message: "Verification failed." });
    }
  });

  // ─── RESEND VERIFICATION ──────────────────────────────────────────────────
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email?.toLowerCase()?.trim());
      if (!user || user.emailVerified) {
        return res.json({ message: "If that email is registered and unverified, we sent a new link." });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createVerificationToken(user.id, token, expiresAt);

      const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
      const baseUrl = `${proto}://${host}`;

      const result = await sendVerificationEmail(user.email, user.displayName || user.username, token, baseUrl);
      res.json({
        message: "Verification email sent.",
        devVerifyUrl: result.sent ? undefined : result.devUrl,
      });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Failed to resend verification." });
    }
  });

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed." });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ message: "Logged in successfully.", user });
      });
    })(req, res, next);
  });

  // ─── GOOGLE ROUTES ─────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/start?error=google_auth_failed" }),
      (req, res) => res.redirect("/chat")
    );
  } else {
    app.get("/api/auth/google", (req, res) => res.status(500).json({ message: "Google OAuth not configured" }));
  }

  // ─── CURRENT USER ──────────────────────────────────────────────────────────
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  next();
};
