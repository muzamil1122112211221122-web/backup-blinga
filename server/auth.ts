import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: true, // Changed to true for demo
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy - only configure if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
            
            if (!user) {
              user = await storage.createUser({
                username: profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || 'user',
                email: profile.emails?.[0]?.value || '',
                password: '', // No password for OAuth users
                provider: 'google',
                providerId: profile.id,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user with id:', id);
      const user = await storage.getUser(id);
      console.log('Found user:', user);
      done(null, user);
    } catch (error) {
      console.log('Error deserializing user:', error);
      done(error);
    }
  });

  // Auth routes - only add Google routes if credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/?error=google_auth_failed" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  } else {
    // Fallback route when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(500).json({ message: "Google OAuth not configured" });
    });
  }

  // Demo authentication route for testing
  app.post("/api/auth/demo", async (req, res) => {
    try {
      let user = await storage.getUserByEmail('demo@lineusapi.com');
      
      if (!user) {
        user = await storage.createUser({
          username: 'demo-user',
          email: 'demo@lineusapi.com',
          password: '',
          provider: 'demo',
          providerId: 'demo-1',
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ message: 'Demo login successful', user });
      });
    } catch (error) {
      res.status(500).json({ message: 'Demo login failed' });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};