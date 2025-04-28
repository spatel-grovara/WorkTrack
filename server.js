import express from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MongoDB URI not set. Please set the MONGODB_URI environment variable.');
  process.exit(1);
}

// Define schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  initials: { type: String, required: true },
}, { timestamps: true });

const TimeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  category: { type: String, default: null },
  description: { type: String, default: null },
}, { timestamps: true });

// Create models
const User = mongoose.model('User', UserSchema);
const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const MongoStore = connectMongo(session);
const sessionStore = new MongoStore({
  mongoUrl: MONGODB_URI,
  collection: 'sessions',
  clear_interval: 3600
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Password functions
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    return false;
  }
}

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    
    // Validate password (using secure comparison)
    const isValid = await comparePasswords(password, user.password);
    if (!isValid) return done(null, false);
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Authentication routes
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.status(200).json(req.user);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.user);
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Time entry routes
app.get("/api/time-entries/active", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const activeEntry = await TimeEntry.findOne({ 
      userId: req.user._id,
      isActive: true
    });
    
    res.json(activeEntry || null);
  } catch (err) {
    res.status(500).json({ message: "Error fetching active time entry" });
  }
});

app.post("/api/time-entries", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    // Check if there's already an active time entry
    const activeEntry = await TimeEntry.findOne({ 
      userId: req.user._id,
      isActive: true
    });
    
    if (activeEntry) {
      return res.status(400).json({ message: "You are already punched in" });
    }
    
    const now = new Date();
    const entry = new TimeEntry({
      userId: req.user._id,
      clockIn: now,
      date: now.toISOString().split('T')[0], // Get YYYY-MM-DD format
      category: req.body.category,
      description: req.body.description
    });
    
    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error("Error creating time entry:", err);
    res.status(500).json({ message: "Error creating time entry: " + (err instanceof Error ? err.message : String(err)) });
  }
});

app.patch("/api/time-entries/:id", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const entryId = req.params.id;
  
  if (!entryId) {
    return res.status(400).json({ message: "Invalid time entry ID" });
  }
  
  try {
    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Time entry not found" });
    }
    
    // Check if the entry belongs to the authenticated user
    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this time entry" });
    }
    
    if (!entry.isActive) {
      return res.status(400).json({ message: "This time entry is already closed" });
    }
    
    const now = new Date();
    
    entry.clockOut = now;
    entry.isActive = false;
    if (req.body.category !== undefined) entry.category = req.body.category;
    if (req.body.description !== undefined) entry.description = req.body.description;
    
    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (err) {
    console.error("Error updating time entry:", err);
    res.status(500).json({ message: "Error updating time entry: " + (err instanceof Error ? err.message : String(err)) });
  }
});

// Stats endpoints
function calculateDuration(entry) {
  if (!entry.clockOut) return null;
  const start = new Date(entry.clockIn).getTime();
  const end = new Date(entry.clockOut).getTime();
  return end - start;
}

app.get("/api/stats/daily", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const entries = await TimeEntry.find({ 
      userId: req.user._id,
      date
    });
    
    const entriesWithDuration = entries.map(entry => {
      const plainEntry = entry.toObject();
      return {
        ...plainEntry,
        duration: calculateDuration(plainEntry)
      };
    });
    
    // Calculate total hours (in milliseconds)
    const totalHours = entriesWithDuration.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0) / (1000 * 60 * 60); // Convert ms to hours
    
    const dailyStats = {
      date,
      totalHours,
      entries: entriesWithDuration,
      isToday: date === today
    };
    
    res.json(dailyStats);
  } catch (err) {
    console.error("Error fetching daily stats:", err);
    res.status(500).json({ message: "Error fetching daily stats" });
  }
});

app.get("/api/stats/weekly", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  let startDate = req.query.startDate;
  
  // If no start date provided, calculate the start of the current week (Monday)
  if (!startDate) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    
    startDate = startOfWeek.toISOString().split('T')[0];
  }
  
  try {
    // Calculate dates for the week (7 days from start date)
    const dates = [];
    const startDateObj = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDateObj);
      date.setDate(startDateObj.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Fetch all time entries for the week
    const entries = await TimeEntry.find({
      userId: req.user._id,
      date: { $in: dates }
    });
    
    // Process daily stats
    const dailyStats = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (const date of dates) {
      const dayEntries = entries.filter(entry => entry.date === date);
      
      const entriesWithDuration = dayEntries.map(entry => {
        const plainEntry = entry.toObject();
        return {
          ...plainEntry,
          duration: calculateDuration(plainEntry)
        };
      });
      
      // Calculate total hours for the day
      const totalHoursDay = entriesWithDuration.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0) / (1000 * 60 * 60); // Convert ms to hours
      
      dailyStats.push({
        date,
        totalHours: totalHoursDay,
        entries: entriesWithDuration,
        isToday: date === today
      });
    }
    
    // Calculate weekly totals
    const totalHours = dailyStats.reduce((sum, day) => sum + day.totalHours, 0);
    const targetHours = 40; // Weekly target (40 hours)
    const remainingHours = Math.max(0, targetHours - totalHours);
    const progressPercentage = Math.min(100, (totalHours / targetHours) * 100);
    
    res.json({
      totalHours,
      remainingHours,
      progressPercentage,
      dailyStats
    });
  } catch (err) {
    console.error("Error fetching weekly stats:", err);
    res.status(500).json({ message: "Error fetching weekly stats" });
  }
});

app.get("/api/time-entries/recent", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const entries = await TimeEntry.find({ userId: req.user._id })
      .sort({ clockIn: -1 })
      .limit(limit);
    
    const entriesWithDuration = entries.map(entry => {
      const plainEntry = entry.toObject();
      return {
        ...plainEntry,
        duration: calculateDuration(plainEntry)
      };
    });
    
    res.json(entriesWithDuration);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recent time entries" });
  }
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from the dist/client directory
app.use(express.static(resolve(__dirname, 'dist/client')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist/client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});