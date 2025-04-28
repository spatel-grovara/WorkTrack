// Simple production server that doesn't require any TypeScript or Vite
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import MongoStore from 'connect-mongo';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_PATH = path.join(__dirname, 'client/dist');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/worktrack';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  initials: { type: String }
});

// Time entry schema
const TimeEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  date: { type: Date, required: true },
  category: { type: String, default: 'work' },
  description: { type: String, default: '' }
});

// Models
const User = mongoose.model('User', UserSchema);
const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);

// Setup Express
const app = express();
app.use(express.json());

// Password utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBufStored = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBufStored, suppliedBuf);
}

// Session setup
const sessionSettings = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production'
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session(sessionSettings));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Auth routes
app.post("/api/register", async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const hashedPassword = await hashPassword(req.body.password);
    let initials = '';
    if (req.body.displayName) {
      initials = req.body.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
    }

    const user = await User.create({
      username: req.body.username,
      password: hashedPassword,
      displayName: req.body.displayName,
      initials
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.user);
});

// Require auth middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Time entry routes
app.get("/api/time-entries/active", requireAuth, async (req, res) => {
  try {
    const activeEntry = await TimeEntry.findOne({
      userId: req.user.id,
      isActive: true
    });
    res.json(activeEntry || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/time-entries", requireAuth, async (req, res) => {
  try {
    const newEntry = await TimeEntry.create({
      userId: req.user.id,
      clockIn: new Date(),
      date: new Date(),
      isActive: true,
      category: req.body.category || 'work',
      description: req.body.description || ''
    });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/time-entries/:id", requireAuth, async (req, res) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const updates = {};
    if (req.body.clockOut) {
      updates.clockOut = new Date();
      updates.isActive = false;
    }
    if (req.body.category) updates.category = req.body.category;
    if (req.body.description) updates.description = req.body.description;
    
    const updatedEntry = await TimeEntry.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper functions for stats
function calculateDuration(entry) {
  if (!entry.clockOut) return null;
  const clockIn = new Date(entry.clockIn);
  const clockOut = new Date(entry.clockOut);
  return clockOut.getTime() - clockIn.getTime();
}

function addDurationToEntries(entries) {
  return entries.map(entry => {
    const entryObj = entry.toObject ? entry.toObject() : entry;
    return {
      ...entryObj,
      duration: calculateDuration(entry)
    };
  });
}

// Stats routes
app.get("/api/stats/daily", requireAuth, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const entries = await TimeEntry.find({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ clockIn: 1 });
    
    const entriesWithDuration = addDurationToEntries(entries);
    const totalMilliseconds = entriesWithDuration.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);
    
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    
    res.json({
      date: date.toISOString().split('T')[0],
      totalHours,
      entries: entriesWithDuration,
      isToday: new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats/weekly", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(today);
    
    // Set to the beginning of the week (Monday)
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    const dailyStats = [];
    let totalHours = 0;
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const entries = await TimeEntry.find({
        userId: req.user.id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ clockIn: 1 });
      
      const entriesWithDuration = addDurationToEntries(entries);
      const dailyMilliseconds = entriesWithDuration.reduce((total, entry) => {
        return total + (entry.duration || 0);
      }, 0);
      
      const dailyHours = dailyMilliseconds / (1000 * 60 * 60);
      totalHours += dailyHours;
      
      dailyStats.push({
        date: currentDate.toISOString().split('T')[0],
        totalHours: dailyHours,
        entries: entriesWithDuration,
        isToday: today.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
      });
    }
    
    const weeklyTargetHours = 40;
    const remainingHours = Math.max(0, weeklyTargetHours - totalHours);
    const progressPercentage = Math.min(100, (totalHours / weeklyTargetHours) * 100);
    
    res.json({
      totalHours,
      remainingHours,
      progressPercentage,
      dailyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/time-entries/recent", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const entries = await TimeEntry.find({
      userId: req.user.id
    })
    .sort({ clockIn: -1 })
    .limit(limit);
    
    const entriesWithDuration = addDurationToEntries(entries);
    res.json(entriesWithDuration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Static files - try multiple paths
const STATIC_PATHS = [
  path.join(__dirname, 'client/dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'client/public')
];

// Check if directories exist and use them
for (const staticPath of STATIC_PATHS) {
  if (existsSync(staticPath)) {
    console.log(`Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
  }
}

// Always return the main index.html for React routes
app.get('*', (req, res) => {
  // Try multiple index.html locations
  for (const staticPath of STATIC_PATHS) {
    const indexPath = path.join(staticPath, 'index.html');
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Fallback - generate a basic HTML page
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WorkTrack - Time Tracking App</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; }
          .container { max-width: 600px; margin: 0 auto; padding: 2rem; }
          h1 { color: #3b82f6; }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="container">
            <h1>WorkTrack</h1>
            <p>The application is running, but the static assets couldn't be located.</p>
            <p>Try redeploying the application.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});