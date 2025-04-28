import dayjs from 'date-fns';
import { format, formatDistance, differenceInMilliseconds, addDays, startOfWeek } from 'date-fns';
import type { TimeEntry, DayInfo } from '../types';

// Format time as "1:30 PM"
export function formatTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  return format(new Date(date), 'h:mm a');
}

// Format date as "Monday, January 15, 2024"
export function formatFullDate(date: Date | string): string {
  return format(new Date(date), 'EEEE, MMMM d, yyyy');
}

// Format date as "Mon"
export function formatShortDay(date: Date | string): string {
  return format(new Date(date), 'EEE');
}

// Format time duration as "4h 15m"
export function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return '0h 0m';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

// Get time since a given date as "Since 9:00 AM"
export function getTimeSince(date: Date | string): string {
  return `Since ${formatTime(date)}`;
}

// Calculate duration between start and end time or current time if still active
export function calculateDuration(start: Date | string, end: Date | string | null): number {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  return differenceInMilliseconds(endDate, startDate);
}

// Format relative time like "Today at 9:00 AM" or "Yesterday at 5:30 PM"
export function formatRelativeTime(date: Date | string): string {
  const formattedDate = new Date(date);
  const today = new Date();
  
  // Check if it's today
  if (format(formattedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return `Today at ${formatTime(formattedDate)}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (format(formattedDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return `Yesterday at ${formatTime(formattedDate)}`;
  }
  
  // Otherwise return the full date
  return `${format(formattedDate, 'MMM d')} at ${formatTime(formattedDate)}`;
}

// Get the current week dates
export function getCurrentWeekDates(): string[] {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
  }
  
  return weekDates;
}

// Generate day info for the weekly overview
export function generateDayInfo(dailyStats: any[]): DayInfo[] {
  const today = new Date().toISOString().split('T')[0];
  
  return dailyStats.map(day => {
    const date = day.date;
    const entries = day.entries;
    
    let startTime = null;
    let endTime = null;
    let status: 'complete' | 'short' | 'in-progress' | 'upcoming' = 'upcoming';
    
    if (entries.length > 0) {
      // Find first clock in and last clock out
      const firstEntry = entries.reduce((earliest, entry) => {
        return new Date(entry.clockIn) < new Date(earliest.clockIn) ? entry : earliest;
      }, entries[0]);
      
      startTime = firstEntry.clockIn;
      
      // Find if there are any active entries
      const activeEntry = entries.find(entry => entry.isActive);
      
      if (activeEntry) {
        endTime = new Date().toISOString();
        status = 'in-progress';
      } else if (entries.every(entry => entry.clockOut)) {
        // All entries are complete
        const lastEntry = entries.reduce((latest, entry) => {
          return new Date(entry.clockOut!) > new Date(latest.clockOut!) ? entry : latest;
        }, entries[0]);
        
        endTime = lastEntry.clockOut;
        
        // Determine if the day was complete or short
        status = day.totalHours >= 8 ? 'complete' : 'short';
      }
    }
    
    // If the date is in the future, it's upcoming
    if (date > today) {
      status = 'upcoming';
    }
    
    return {
      name: formatShortDay(date),
      date,
      hours: day.totalHours,
      startTime,
      endTime,
      status
    };
  });
}
