import { 
  users, type User, type InsertUser, 
  timeEntries, type TimeEntry, type InsertTimeEntry, type UpdateTimeEntry,
  type TimeEntryWithDuration, type DailyStats, type WeeklyStats
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Time entry methods
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined>;
  updateTimeEntry(id: number, update: UpdateTimeEntry): Promise<TimeEntry | undefined>;
  getTimeEntryById(id: number): Promise<TimeEntry | undefined>;
  
  // Stats methods
  getDailyStats(userId: number, date: string): Promise<DailyStats>;
  getWeeklyStats(userId: number, startDate: string): Promise<WeeklyStats>;
  getRecentTimeEntries(userId: number, limit: number): Promise<TimeEntryWithDuration[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db
      .insert(timeEntries)
      .values({
        ...entry,
        isActive: true,
        clockOut: null
      })
      .returning();
    return timeEntry;
  }

  async getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.isActive, true)
      ));
    return entry;
  }

  async updateTimeEntry(id: number, update: UpdateTimeEntry): Promise<TimeEntry | undefined> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set(update)
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async getTimeEntryById(id: number): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));
    return entry;
  }

  // Helper function to calculate duration in milliseconds
  private calculateDuration(entry: TimeEntry): number | null {
    if (!entry.clockOut) return null;
    return new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime();
  }

  // Helper to add duration to time entries
  private addDurationToEntries(entries: TimeEntry[]): TimeEntryWithDuration[] {
    return entries.map(entry => ({
      ...entry,
      duration: this.calculateDuration(entry)
    }));
  }

  async getDailyStats(userId: number, date: string): Promise<DailyStats> {
    const entries = await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.date, date)
      ));
    
    const entriesWithDuration = this.addDurationToEntries(entries);
    
    // Calculate total hours
    const totalMilliseconds = entriesWithDuration.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);
    
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    
    const today = new Date().toISOString().split('T')[0];
    
    return {
      date,
      totalHours,
      entries: entriesWithDuration,
      isToday: date === today
    };
  }

  async getWeeklyStats(userId: number, startDate: string): Promise<WeeklyStats> {
    // Generate dates for the week
    const weekDates = [];
    const startDateObj = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDateObj);
      date.setDate(startDateObj.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    // Get daily stats for each day
    const dailyStatsPromises = weekDates.map(date => this.getDailyStats(userId, date));
    const dailyStats = await Promise.all(dailyStatsPromises);
    
    // Calculate weekly totals
    const totalHours = dailyStats.reduce((total, day) => total + day.totalHours, 0);
    const targetHours = 40; // Weekly target hours
    const remainingHours = Math.max(0, targetHours - totalHours);
    const progressPercentage = (totalHours / targetHours) * 100;
    
    return {
      totalHours,
      remainingHours,
      progressPercentage: Math.min(100, progressPercentage),
      dailyStats
    };
  }

  async getRecentTimeEntries(userId: number, limit: number): Promise<TimeEntryWithDuration[]> {
    const entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.clockIn))
      .limit(limit);
    
    return this.addDurationToEntries(entries);
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
