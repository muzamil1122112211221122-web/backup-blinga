import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: true, // Changed to true for demo
    store: new (connectPg(session))({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // This will create the session table
      ttl: 7 * 24 * 60 * 60, // 1 week in seconds
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
          callbackURL: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`,
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

    app.get("/api/auth/google/callback",
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
    
    // Auto-login with demo user
    try {
      const sessionId = req.session.id || require('crypto').randomUUID();
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
      
      // Create a unique identifier for each demo session
      // This ensures each user gets their own separate account
      const sessionId = req.session.id || require('crypto').randomUUID();
      const uniqueEmail = `demo-${sessionId}@forus.com`;
      const uniqueProviderId = `demo-${sessionId}`;
      
      // Try to find existing user by unique provider ID first
      let user = await storage.getUserByProviderId(uniqueProviderId);
      
      // If not found by provider ID, check by email as fallback
      if (!user) {
        user = await storage.getUserByEmail(uniqueEmail);
      }
      
      if (!user) {
        // Create a new unique user for this session
        user = await storage.createUser({
          username: displayName || 'demo-user',
          email: uniqueEmail,
          password: '',
          provider: 'demo',
          providerId: uniqueProviderId,
          displayName: displayName || null,
          birthDate: birthDate || null,
        });
        console.log(`Created new demo user: ${user.id} with email: ${uniqueEmail}`);
      } else {
        // Update existing user with new info
        const updatedUser = await storage.updateUser(user.id, {
          username: displayName || user.username,
          displayName: displayName || user.displayName,
          birthDate: birthDate || user.birthDate,
        });
        if (updatedUser) {
          user = updatedUser;
        }
        console.log(`Updated existing demo user: ${user.id}`);
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