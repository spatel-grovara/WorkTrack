import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeeklyStats, DayInfo } from '../types';
import { formatTime, generateDayInfo } from '../lib/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface WeeklyOverviewProps {
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;
}

export function WeeklyOverview({ weeklyStats, isLoading }: WeeklyOverviewProps) {
  const getDayInfo = (): DayInfo[] => {
    if (!weeklyStats) return [];
    return generateDayInfo(weeklyStats.dailyStats);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Complete
          </Badge>
        );
      case 'short':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Short
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Upcoming
          </Badge>
        );
    }
  };
  
  const days = getDayInfo();
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-7">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="relative rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm flex flex-col">
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-8 w-12 my-1" />
                  <Skeleton className="h-4 w-24 my-1" />
                  <Skeleton className="h-6 w-16 mt-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Weekly Overview</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-7">
            {days.map((day, index) => {
              const isToday = day.status === 'in-progress';
              const isUpcoming = day.status === 'upcoming';
              
              return (
                <div 
                  key={index} 
                  className={`relative rounded-lg ${
                    isToday 
                      ? 'border-2 border-primary-200 bg-primary-50' 
                      : 'border border-gray-200 bg-white'
                  } px-4 py-5 shadow-sm flex flex-col ${isUpcoming ? 'opacity-60' : ''}`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-primary-500' : 'text-gray-500'}`}>
                    {day.name}
                  </div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{Math.floor(day.hours)}h</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {day.startTime && day.endTime 
                      ? `${formatTime(day.startTime)} - ${formatTime(day.endTime)}`
                      : 'Not started'}
                  </div>
                  <span className="mt-2">
                    {getStatusBadge(day.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
