import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DailyStats, TimeEntry } from '../types';
import { formatDuration, formatTime } from '../lib/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface TodayStatsCardProps {
  dailyStats: DailyStats | null;
  activeTimeEntry: TimeEntry | null | undefined;
  isLoading: boolean;
}

export function TodayStatsCard({ dailyStats, activeTimeEntry, isLoading }: TodayStatsCardProps) {
  const getTotalHours = () => {
    if (!dailyStats) return '0h 0m';
    
    // Calculate hours in hours and minutes format
    return formatDuration(dailyStats.totalHours * 60 * 60 * 1000);
  };
  
  const getStartTime = () => {
    if (!dailyStats || !dailyStats.entries.length) return 'N/A';
    
    // Find earliest clock in time of the day
    const earliestEntry = dailyStats.entries.reduce((earliest, entry) => {
      return new Date(entry.clockIn) < new Date(earliest.clockIn) ? entry : earliest;
    }, dailyStats.entries[0]);
    
    return formatTime(earliestEntry.clockIn);
  };
  
  const getCurrentOrEndTime = () => {
    if (!dailyStats || !dailyStats.entries.length) return 'N/A';
    
    // If there's an active time entry, show current time
    if (activeTimeEntry) {
      return formatTime(new Date());
    }
    
    // Otherwise find the latest clock out time
    const latestEntry = dailyStats.entries
      .filter(entry => entry.clockOut) // Only consider entries with clockOut
      .reduce((latest, entry) => {
        return entry.clockOut && latest.clockOut && 
          new Date(entry.clockOut) > new Date(latest.clockOut) 
          ? entry 
          : latest;
      }, { clockOut: null } as TimeEntry);
    
    return latestEntry.clockOut ? formatTime(latestEntry.clockOut) : 'N/A';
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <Skeleton className="h-6 w-24 mb-5" />
            <div className="mt-5">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Today</h3>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Hours Worked</div>
              <div className="text-2xl font-semibold text-gray-900">{getTotalHours()}</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Start Time</div>
              <div className="text-sm font-medium text-gray-900">{getStartTime()}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">Current / End Time</div>
              <div className="text-sm font-medium text-gray-900">{getCurrentOrEndTime()}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">View today's details</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
