import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WeeklyStats } from '../types';
import { formatDuration } from '../lib/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface WeeklyStatsCardProps {
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;
}

export function WeeklyStatsCard({ weeklyStats, isLoading }: WeeklyStatsCardProps) {
  const getTotalHours = () => {
    if (!weeklyStats) return '0h 0m';
    return formatDuration(weeklyStats.totalHours * 60 * 60 * 1000);
  };
  
  const getRemainingHours = () => {
    if (!weeklyStats) return '40h 0m';
    return formatDuration(weeklyStats.remainingHours * 60 * 60 * 1000);
  };
  
  const getProgressPercentage = () => {
    if (!weeklyStats) return 0;
    return Math.min(100, weeklyStats.progressPercentage);
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
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="mt-4 flex items-center justify-between">
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">This Week</h3>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Hours Worked</div>
              <div className="flex items-center">
                <div className="text-2xl font-semibold text-gray-900">{getTotalHours()}</div>
                <div className="ml-2 text-sm text-gray-500">/ 40h</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-sm text-gray-500">{getProgressPercentage().toFixed(0)}%</div>
              </div>
              <div className="mt-1 relative">
                <Progress value={getProgressPercentage()} className="h-2 bg-gray-200" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Hours Remaining</div>
              <div className="text-sm font-medium text-gray-900">{getRemainingHours()}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">View weekly details</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
