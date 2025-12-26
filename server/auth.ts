import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import memoryStoreFactory from "memorystore";
import { storage } from "./storage";

const MemoryStore = memoryStoreFactory(session);

export function setupAuth(app: Express) {
  const connectionString = process.env.DATABASE_URL;
  
  let sessionStore;
  if (connectionString) {
    try {
      sessionStore = new (connectPg(session))({
        conString: connectionString,
        createTableIfMissing: true,
        tableName: 'session',
        ttl: 7 * 24 * 60 * 60,
      });
      console.log("Using PostgreSQL for session storage");
    } catch (e) {
      console.error("Failed to initialize PG session store, falling back to memory:", e);
    }
  }

  if (!sessionStore) {
    sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    console.warn("Using MemoryStore for session storage");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    store: sessionStore,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Force session save on every request to ensure reliability in demo environment
  app.use((req, res, next) => {
    if (req.session && !req.session.save) {
      return next();
    }
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, callback?: any) {
      if (req.session) {
        req.session.save((err) => {
          if (err) console.error("Session save error:", err);
          originalEnd.call(this, chunk, encoding, callback);
        });
      } else {
        originalEnd.call(this, chunk, encoding, callback);
      }
    } as any;
    next();
  });

  // Google OAuth Strategy - only configure if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Use the correct Replit domain from REPLIT_DOMAINS environment variable
    const domain = process.env.REPLIT_DOMAINS || `${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`;
    const callbackURL = `https://${domain}/auth/google/callback`;
    
    console.log('Google OAuth Callback URL:', callbackURL);
    console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL,
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
      
      if (!user) {
        console.log('User not found, clearing session');
        // User doesn't exist, clear the session
        return done(null, false);
      }
      
      console.log('Found user:', user);
      done(null, user);
    } catch (error) {
      console.log('Error deserializing user:', error);
      // Clear the session on any error
      done(null, false);
    }
  });

  // Auth routes - only add Google routes if credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/?error=google_auth_failed" }),
      (req, res) => {
        res.redirect("/chat");
      }
    );
  } else {
    // Fallback route when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(500).json({ message: "Google OAuth not configured" });
    });
  }

  // Demo authentication route for testing
  app.get("/api/auth/demo", async (req, res) => {
    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/chat';
    
    // Auto-login with unique demo user per session
    try {
      const sessionId = req.sessionID; // Use stable sessionID
      const uniqueEmail = `demo-${sessionId}@forus.com`;
      const uniqueProviderId = `demo-${sessionId}`;
      
      let user = await storage.getUserByProviderId(uniqueProviderId);
      
      if (!user) {
        user = await storage.getUserByEmail(uniqueEmail);
      }
      
      if (!user) {
        user = await storage.createUser({
          username: 'Demo User',
          email: uniqueEmail,
          password: '',
          provider: 'demo',
          providerId: uniqueProviderId,
          displayName: 'Demo User',
          birthDate: null,
        });
        console.log(`Created demo user: ${user.id} with sessionId: ${sessionId}`);
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Demo login error:', err);
          return res.redirect('/?error=demo_login_failed');
        }
        res.redirect(redirect);
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.redirect('/?error=demo_login_failed');
    }
  });

  app.post("/api/auth/demo", async (req, res) => {
    try {
      const { displayName, birthDate } = req.body;
      
      if (!displayName || !birthDate) {
        return res.status(400).json({ message: 'Name and birth date are required' });
      }
      
      // Create a base identifier from name and birthdate
      const baseIdentifier = `${displayName.toLowerCase().replace(/\s+/g, '')}-${birthDate}`;
      
      console.log(`Demo login attempt for: ${displayName} (${birthDate})`);
      
      // First, check if a user with this exact name and birthdate already exists
      const existingUsers = await storage.getUsersByNameAndBirthDate(displayName, birthDate);
      
      let user;
      if (existingUsers.length > 0) {
        // User found - use the existing account
        user = existingUsers[0];
        console.log(`Found existing user: ${user.id} for ${displayName}`);
      } else {
        // No existing user - create a new one with a unique identifier
        // Add timestamp to ensure uniqueness even for same name+birthdate
        const uniqueTimestamp = Date.now();
        const uniqueIdentifier = `${baseIdentifier}-${uniqueTimestamp}`;
        const uniqueEmail = `demo-${uniqueIdentifier}@forus.com`;
        const uniqueProviderId = `demo-${uniqueIdentifier}`;
        
        user = await storage.createUser({
          username: displayName,
          email: uniqueEmail,
          password: '',
          provider: 'demo',
          providerId: uniqueProviderId,
          displayName: displayName,
          birthDate: birthDate,
        });
        console.log(`Created new demo user: ${user.id} for ${displayName} with unique ID: ${uniqueIdentifier}`);
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ message: 'Demo login successful', user });
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Demo login failed' });
    }
  });

  app.post("/api/auth/update-profile", requireAuth, async (req, res) => {
    try {
      const { displayName, birthDate } = req.body;
      const userId = (req.user as any)?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updatedUser = await storage.updateUser(userId, {
        displayName,
        birthDate,
        username: displayName, // Also update username to match display name
      });

      res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: 'Profile update failed' });
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