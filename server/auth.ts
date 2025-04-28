import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { mongoStorage } from "./mongodb-storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const secret = process.env.SESSION_SECRET || 'timetrackersecret';
  
  const sessionSettings: session.SessionOptions = {
    secret,
    resave: false,
    saveUninitialized: false,
    store: mongoStorage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production',
    }
  };
  
  // Clear any existing sessions to avoid deserialize errors during migration
  try {
    (mongoStorage.sessionStore as any).clear();
    console.log('Cleared existing sessions');
  } catch (err) {
    console.error('Error clearing sessions:', err);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await mongoStorage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    try {
      // Ensure we serialize the user ID as a string
      done(null, user.id.toString());
    } catch (err) {
      console.error('Error serializing user:', err);
      done(err);
    }
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const user = await mongoStorage.getUser(id);
      if (!user) {
        console.error('User not found for ID:', id);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, displayName } = req.body;
      
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const existingUser = await mongoStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Generate initials from display name
      const initials = displayName
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      
      const user = await mongoStorage.createUser({
        username,
        password: await hashPassword(password),
        displayName,
        initials
      });

      // Log the user in after successful registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}