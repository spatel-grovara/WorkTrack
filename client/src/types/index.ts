export type User = {
  id: number;
  username: string;
  displayName: string;
  initials: string;
};

export type TimeEntry = {
  id: number;
  userId: number;
  clockIn: string;
  clockOut: string | null;
  isActive: boolean;
  date: string;
  duration: number | null;
  category?: string;
  description?: string;
};

export type DailyStats = {
  date: string;
  totalHours: number;
  entries: TimeEntry[];
  isToday: boolean;
};

export type WeeklyStats = {
  totalHours: number;
  remainingHours: number;
  progressPercentage: number;
  dailyStats: DailyStats[];
};

export type DayInfo = {
  name: string;
  date: string;
  hours: number;
  startTime: string | null;
  endTime: string | null;
  status: 'complete' | 'short' | 'in-progress' | 'upcoming';
};
