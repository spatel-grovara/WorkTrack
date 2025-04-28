import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeEntry } from '../types';
import { 
  formatFullDate, 
  formatTime, 
  formatDuration,
  calculateDuration
} from '../lib/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DetailedEntriesCardProps {
  timeEntries: TimeEntry[] | null;
  isLoading: boolean;
}

export function DetailedEntriesCard({ timeEntries, isLoading }: DetailedEntriesCardProps) {
  // Group entries by category
  const entriesByCategory = React.useMemo(() => {
    if (!timeEntries) return {};
    
    return timeEntries.reduce((groups: { [key: string]: TimeEntry[] }, entry) => {
      const category = entry.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(entry);
      return groups;
    }, {});
  }, [timeEntries]);
  
  // Sort categories by most entries
  const sortedCategories = React.useMemo(() => {
    if (!entriesByCategory) return [];
    
    return Object.keys(entriesByCategory).sort((a, b) => 
      entriesByCategory[b].length - entriesByCategory[a].length
    );
  }, [entriesByCategory]);
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-1" />
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border-b border-gray-200 p-4">
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="space-y-3">
                {[...Array(2)].map((_, entryIndex) => (
                  <div key={entryIndex} className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!timeEntries || timeEntries.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Time by Category</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          No time entries found for this period
        </CardContent>
      </Card>
    );
  }
  
  // Calculate total duration for each category
  const categoryDurations: { [key: string]: number } = {};
  
  for (const category of sortedCategories) {
    const entries = entriesByCategory[category];
    categoryDurations[category] = entries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      } else if (entry.clockOut) {
        return total + calculateDuration(entry.clockIn, entry.clockOut);
      }
      return total;
    }, 0);
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Time by Category</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedCategories.map((category) => (
          <div key={category} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                <Badge className="ml-2" variant="outline">
                  {entriesByCategory[category].length} {entriesByCategory[category].length === 1 ? 'entry' : 'entries'}
                </Badge>
              </div>
              <div className="text-sm font-medium">
                {formatDuration(categoryDurations[category] || 0)}
              </div>
            </div>
            
            <div className="space-y-2">
              {entriesByCategory[category].map((entry) => (
                <div key={entry.id} className="flex justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      {formatFullDate(entry.date)} - {formatTime(entry.clockIn)}
                      {entry.clockOut ? ` to ${formatTime(entry.clockOut)}` : ' (active)'}
                    </span>
                    {entry.description && (
                      <span className="ml-2 text-gray-500 text-xs italic">
                        {entry.description}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {entry.duration 
                      ? formatDuration(entry.duration)
                      : entry.clockOut 
                        ? formatDuration(calculateDuration(entry.clockIn, entry.clockOut))
                        : '—'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}