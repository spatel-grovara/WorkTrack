import express from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from './server/mongodb';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MongoDB URI not set. Please set the MONGODB_URI environment variable.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
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
  mongoUrl: process.env.MONGODB_URI,
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

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    
    // Validate password (simple comparison for now)
    if (user.password !== password) return done(null, false);
    
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

// Import API routes
import { registerRoutes } from './server/mongodb-routes.js';

// Initialize routes
registerRoutes(app);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from the dist/client directory
app.use(express.static(resolve(__dirname, 'dist/client')));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist/client', 'index.html'));
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