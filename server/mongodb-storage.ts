import { User, TimeEntry } from './mongodb';
import session from 'express-session';
import { 
  TimeEntryWithDuration, 
  DailyStats, 
  WeeklyStats,
  InsertTimeEntry,
  UpdateTimeEntry,
  InsertUser,
  InsertTimeEntryMongo
} from '@shared/schema';
import { Types } from 'mongoose';
import connectMongo from 'connect-mongo';

export interface IMongoStorage {
  // User methods
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: InsertUser): Promise<any>;
  
  // Time entry methods
  createTimeEntry(entry: InsertTimeEntryMongo): Promise<any>;
  getActiveTimeEntry(userId: string): Promise<any | undefined>;
  updateTimeEntry(id: string, update: UpdateTimeEntry): Promise<any | undefined>;
  getTimeEntryById(id: string): Promise<any | undefined>;
  
  // Stats methods
  getDailyStats(userId: string, date: string): Promise<DailyStats>;
  getWeeklyStats(userId: string, startDate: string): Promise<WeeklyStats>;
  getRecentTimeEntries(userId: string, limit: number): Promise<TimeEntryWithDuration[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MongoDBStorage implements IMongoStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Use MongoDB for session storage
    this.sessionStore = connectMongo.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://patelsmit5:admin@refugee-assistant-app.xl93pss.mongodb.net/?retryWrites=true&w=majority&appName=Refugee-assistant-app',
      ttl: 86400, // 1 day
      autoRemove: 'native',
      collectionName: 'sessions'
    });
  }

  // User methods
  async getUser(id: string): Promise<any | undefined> {
    try {
      const user = await User.findById(id);
      if (!user) return undefined;
      
      return {
        id: user._id.toString(),
        username: user.username,
        password: user.password,
        displayName: user.displayName,
        initials: user.initials
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ username });
      if (!user) return undefined;
      
      return {
        id: user._id.toString(),
        username: user.username,
        password: user.password,
        displayName: user.displayName,
        initials: user.initials
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<any> {
    try {
      const newUser = new User({
        username: userData.username,
        password: userData.password,
        displayName: userData.displayName,
        initials: userData.initials
      });
      
      const savedUser = await newUser.save();
      
      return {
        id: savedUser._id.toString(),
        username: savedUser.username,
        password: savedUser.password,
        displayName: savedUser.displayName,
        initials: savedUser.initials
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Time entry methods
  async createTimeEntry(entry: InsertTimeEntryMongo): Promise<any> {
    try {
      const newEntry = new TimeEntry({
        userId: typeof entry.userId === 'string' ? new Types.ObjectId(entry.userId) : entry.userId,
        clockIn: entry.clockIn,
        date: entry.date,
        category: entry.category,
        description: entry.description,
        isActive: true
      });
      
      const savedEntry = await newEntry.save();
      
      return {
        id: savedEntry._id.toString(),
        userId: savedEntry.userId.toString(),
        clockIn: savedEntry.clockIn,
        clockOut: savedEntry.clockOut,
        isActive: savedEntry.isActive,
        date: savedEntry.date,
        category: savedEntry.category,
        description: savedEntry.description
      };
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  async getActiveTimeEntry(userId: string): Promise<any | undefined> {
    try {
      const activeEntry = await TimeEntry.findOne({ 
        userId: new Types.ObjectId(userId), 
        isActive: true 
      });
      
      if (!activeEntry) return undefined;
      
      return {
        id: activeEntry._id.toString(),
        userId: activeEntry.userId.toString(),
        clockIn: activeEntry.clockIn,
        clockOut: activeEntry.clockOut,
        isActive: activeEntry.isActive,
        date: activeEntry.date,
        category: activeEntry.category,
        description: activeEntry.description
      };
    } catch (error) {
      console.error('Error getting active time entry:', error);
      return undefined;
    }
  }

  async updateTimeEntry(id: string, update: UpdateTimeEntry): Promise<any | undefined> {
    try {
      const updatedEntry = await TimeEntry.findByIdAndUpdate(
        id,
        { 
          $set: { 
            clockOut: update.clockOut,
            isActive: update.isActive,
            category: update.category,
            description: update.description
          } 
        },
        { new: true }
      );
      
      if (!updatedEntry) return undefined;
      
      return {
        id: updatedEntry._id.toString(),
        userId: updatedEntry.userId.toString(),
        clockIn: updatedEntry.clockIn,
        clockOut: updatedEntry.clockOut,
        isActive: updatedEntry.isActive,
        date: updatedEntry.date,
        category: updatedEntry.category,
        description: updatedEntry.description
      };
    } catch (error) {
      console.error('Error updating time entry:', error);
      return undefined;
    }
  }

  async getTimeEntryById(id: string): Promise<any | undefined> {
    try {
      const entry = await TimeEntry.findById(id);
      if (!entry) return undefined;
      
      return {
        id: entry._id.toString(),
        userId: entry.userId.toString(),
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        isActive: entry.isActive,
        date: entry.date,
        category: entry.category,
        description: entry.description
      };
    } catch (error) {
      console.error('Error getting time entry by ID:', error);
      return undefined;
    }
  }

  // Helper method to calculate duration in milliseconds
  private calculateDuration(entry: any): number | null {
    if (!entry.clockOut) return null;
    
    const clockIn = new Date(entry.clockIn).getTime();
    const clockOut = new Date(entry.clockOut).getTime();
    
    return clockOut - clockIn;
  }

  // Helper method to add duration to time entries
  private addDurationToEntries(entries: any[]): TimeEntryWithDuration[] {
    return entries.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      isActive: entry.isActive,
      date: entry.date,
      category: entry.category,
      description: entry.description,
      duration: this.calculateDuration(entry)
    }));
  }

  // Stats methods
  async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    try {
      const entries = await TimeEntry.find({
        userId: new Types.ObjectId(userId),
        date: date
      }).sort({ clockIn: 1 });
      
      // Convert Mongoose documents to plain objects
      const formattedEntries = entries.map(entry => ({
        id: entry._id.toString(),
        userId: entry.userId.toString(),
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        isActive: entry.isActive,
        date: entry.date,
        category: entry.category,
        description: entry.description
      }));
      
      // Add duration to entries
      const entriesWithDuration = this.addDurationToEntries(formattedEntries);
      
      // Calculate total hours
      let totalHours = 0;
      entriesWithDuration.forEach(entry => {
        if (entry.duration) {
          totalHours += entry.duration / (1000 * 60 * 60); // Convert ms to hours
        }
      });
      
      // Check if this is today
      const today = new Date().toISOString().split('T')[0];
      const isToday = date === today;
      
      return {
        date,
        totalHours,
        entries: entriesWithDuration,
        isToday
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      
      // Return empty stats if there's an error
      return {
        date,
        totalHours: 0,
        entries: [],
        isToday: date === new Date().toISOString().split('T')[0]
      };
    }
  }

  async getWeeklyStats(userId: string, startDate: string): Promise<WeeklyStats> {
    try {
      // Calculate end date (7 days from start date)
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + 6);
      
      // Generate array of 7 dates for the week
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Fetch daily stats for each day
      const dailyStatsPromises = dates.map(date => this.getDailyStats(userId, date));
      const dailyStats = await Promise.all(dailyStatsPromises);
      
      // Calculate total hours for the week
      const totalHours = dailyStats.reduce((sum, day) => sum + day.totalHours, 0);
      
      // Target is 40 hours per week
      const remainingHours = Math.max(0, 40 - totalHours);
      
      // Calculate progress percentage (capped at 100%)
      const progressPercentage = Math.min(100, (totalHours / 40) * 100);
      
      return {
        totalHours,
        remainingHours,
        progressPercentage,
        dailyStats
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      
      // Return empty stats if there's an error
      return {
        totalHours: 0,
        remainingHours: 40,
        progressPercentage: 0,
        dailyStats: []
      };
    }
  }

  async getRecentTimeEntries(userId: string, limit: number): Promise<TimeEntryWithDuration[]> {
    try {
      const entries = await TimeEntry.find({
        userId: new Types.ObjectId(userId)
      })
      .sort({ clockIn: -1 }) // Latest first
      .limit(limit);
      
      // Convert Mongoose documents to plain objects
      const formattedEntries = entries.map(entry => ({
        id: entry._id.toString(),
        userId: entry.userId.toString(),
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        isActive: entry.isActive,
        date: entry.date,
        category: entry.category,
        description: entry.description
      }));
      
      // Add duration to entries
      return this.addDurationToEntries(formattedEntries);
    } catch (error) {
      console.error('Error getting recent time entries:', error);
      return [];
    }
  }
}

export const mongoStorage = new MongoDBStorage();