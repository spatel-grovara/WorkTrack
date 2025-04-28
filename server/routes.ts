import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage";
import { 
  insertTimeEntrySchema, 
  updateTimeEntrySchema,
  insertUserSchema, 
  User
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: fromZodError(error).message };
      }
      return { data: null, error: "Invalid request data" };
    }
  };

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Get active time entry
  app.get("/api/time-entries/active", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    try {
      const activeEntry = await mongoStorage.getActiveTimeEntry(userId);
      res.json(activeEntry || null);
    } catch (err) {
      res.status(500).json({ message: "Error fetching active time entry" });
    }
  });

  // Create a new time entry (punch in)
  app.post("/api/time-entries", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    try {
      // Check if there's already an active time entry
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (activeEntry) {
        return res.status(400).json({ message: "You are already punched in" });
      }
      
      const now = new Date();
      const entry = {
        userId,
        clockIn: now,
        date: now.toISOString().split('T')[0], // Get YYYY-MM-DD format
        category: req.body.category,
        description: req.body.description
      };
      
      const { data, error } = validateRequest(insertTimeEntrySchema, entry);
      if (error) {
        return res.status(400).json({ message: error });
      }
      
      const newEntry = await storage.createTimeEntry(data);
      res.status(201).json(newEntry);
    } catch (err) {
      res.status(500).json({ message: "Error creating time entry" });
    }
  });

  // Update a time entry (punch out)
  app.patch("/api/time-entries/:id", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const entryId = parseInt(req.params.id);
    
    if (isNaN(entryId)) {
      return res.status(400).json({ message: "Invalid time entry ID" });
    }
    
    try {
      const entry = await storage.getTimeEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      // Check if the entry belongs to the authenticated user
      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this time entry" });
      }
      
      if (!entry.isActive) {
        return res.status(400).json({ message: "This time entry is already closed" });
      }
      
      const now = new Date();
      const update = {
        clockOut: now,
        isActive: false,
        category: req.body.category !== undefined ? req.body.category : entry.category,
        description: req.body.description !== undefined ? req.body.description : entry.description
      };
      
      const { data, error } = validateRequest(updateTimeEntrySchema, update);
      if (error) {
        return res.status(400).json({ message: error });
      }
      
      const updatedEntry = await storage.updateTimeEntry(entryId, data);
      res.json(updatedEntry);
    } catch (err) {
      res.status(500).json({ message: "Error updating time entry" });
    }
  });

  // Get daily stats
  app.get("/api/stats/daily", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    
    try {
      const stats = await storage.getDailyStats(userId, date);
      res.json(stats);
    } catch (err) {
      console.error("Error fetching daily stats:", err);
      res.status(500).json({ message: "Error fetching daily stats" });
    }
  });

  // Get weekly stats
  app.get("/api/stats/weekly", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const startDate = req.query.startDate as string;
    
    // If no start date provided, calculate the start of the current week (Monday)
    const today = new Date();
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // For Monday as the first day, we need day - 1 (or 6 if day is 0/Sunday)
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    
    const weekStartDate = startDate || startOfWeek.toISOString().split('T')[0];
    
    try {
      const stats = await storage.getWeeklyStats(userId, weekStartDate);
      res.json(stats);
    } catch (err) {
      console.error("Error fetching weekly stats:", err);
      res.status(500).json({ message: "Error fetching weekly stats" });
    }
  });

  // Get recent time entries
  app.get("/api/time-entries/recent", requireAuth, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    try {
      const entries = await storage.getRecentTimeEntries(userId, limit);
      res.json(entries);
    } catch (err) {
      res.status(500).json({ message: "Error fetching recent time entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
