import mongoose from 'mongoose';

// MongoDB connection string from environment variable or use the provided one
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patelsmit5:admin@refugee-assistant-app.xl93pss.mongodb.net/?retryWrites=true&w=majority&appName=Refugee-assistant-app';

// Connect to MongoDB
export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  initials: { type: String, required: true },
}, { timestamps: true });

// Time Entry Schema
const TimeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  category: { type: String, default: null },
  description: { type: String, default: null },
}, { timestamps: true });

// Create and export models
export const User = mongoose.model('User', UserSchema);
export const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);