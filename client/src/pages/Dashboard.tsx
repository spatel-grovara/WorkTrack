import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatFullDate } from '../lib/timeUtils';
import { getQueryFn } from '../lib/queryClient';
import { Layout } from '../components/Layout';
import { StatusCard } from '../components/StatusCard';
import { TodayStatsCard } from '../components/TodayStatsCard';
import { WeeklyStatsCard } from '../components/WeeklyStatsCard';
import { WeeklyOverview } from '../components/WeeklyOverview';
import { RecentActivities } from '../components/RecentActivities';
import { DetailedEntriesCard } from '../components/DetailedEntriesCard';
import { TimeEntry, DailyStats, WeeklyStats } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function Dashboard() {
  // Get user from auth context
  const { user, isLoading: isUserLoading } = useAuth();
  
  // Query active time entry
  const { 
    data: activeTimeEntry,
    isLoading: isActiveTimeEntryLoading
  } = useQuery<TimeEntry | null>({
    queryKey: ['/api/time-entries/active'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000, // Refetch every 30 seconds to update durations
  });
  
  // Query daily stats
  const { 
    data: dailyStats,
    isLoading: isDailyStatsLoading
  } = useQuery<DailyStats>({
    queryKey: ['/api/stats/daily'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  
  // Query weekly stats
  const { 
    data: weeklyStats,
    isLoading: isWeeklyStatsLoading
  } = useQuery<WeeklyStats>({
    queryKey: ['/api/stats/weekly'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  
  // Query recent time entries
  const { 
    data: recentTimeEntries,
    isLoading: isRecentTimeEntriesLoading
  } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries/recent'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  
  return (
    <Layout user={user} isLoading={isUserLoading}>
      {/* Header with name and date */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          {isUserLoading ? (
            <>
              <Skeleton className="h-8 w-40 mb-1" />
              <Skeleton className="h-5 w-56" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user?.displayName || 'Employee'}
              </h1>
              <p className="text-sm text-gray-500">
                {formatFullDate(new Date())}
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatusCard 
          activeTimeEntry={activeTimeEntry} 
          isLoading={isActiveTimeEntryLoading} 
        />
        
        <TodayStatsCard
          dailyStats={dailyStats || null}
          activeTimeEntry={activeTimeEntry}
          isLoading={isDailyStatsLoading || isActiveTimeEntryLoading}
        />
        
        <WeeklyStatsCard
          weeklyStats={weeklyStats || null}
          isLoading={isWeeklyStatsLoading}
        />
      </div>
      
      {/* Weekly Overview */}
      <WeeklyOverview
        weeklyStats={weeklyStats || null}
        isLoading={isWeeklyStatsLoading}
      />
      
      {/* Recent Activities */}
      <RecentActivities
        timeEntries={recentTimeEntries || null}
        isLoading={isRecentTimeEntriesLoading}
      />
      
      {/* Detailed Entries by Category */}
      <DetailedEntriesCard
        timeEntries={recentTimeEntries || null}
        isLoading={isRecentTimeEntriesLoading}
      />
    </Layout>
  );
}
