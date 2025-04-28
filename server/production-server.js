import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import session from 'express-session';
import { setupAuth } from './auth.ts';
import { mongoStorage } from './mongodb-storage.ts';
import { registerRoutes } from './mongodb-routes.ts';
import { connectToMongoDB } from './mongodb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
await connectToMongoDB();

const app = express();
app.use(express.json());

// Setup session
const sessionSettings = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: mongoStorage.sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session(sessionSettings));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Setup authentication
setupAuth(app);

// Register API routes
const server = await registerRoutes(app);

// Serve static files in production
const clientPath = path.resolve(__dirname, '../client/dist');
console.log(`Serving static files from: ${clientPath}`);
app.use(express.static(clientPath));

// Always return the main index.html for any unhandled request
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});