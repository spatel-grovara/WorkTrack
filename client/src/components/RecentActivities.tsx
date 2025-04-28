import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimeEntry } from '../types';
import { formatRelativeTime } from '../lib/timeUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActivitiesProps {
  timeEntries: TimeEntry[] | null;
  isLoading: boolean;
}

export function RecentActivities({ timeEntries, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="bg-white p-0">
            <ul role="list" className="divide-y divide-gray-200">
              {[...Array(3)].map((_, index) => (
                <li key={index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="ml-4">
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="bg-white p-0">
          <ul role="list" className="divide-y divide-gray-200">
            {timeEntries && timeEntries.length > 0 ? (
              timeEntries.map((entry) => (
                <li key={entry.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full ${
                          entry.isActive || !entry.clockOut
                            ? 'bg-primary-100' 
                            : 'bg-red-100'
                        } flex items-center justify-center`}>
                          <i className={`${
                            entry.isActive || !entry.clockOut
                              ? 'ri-login-circle-line text-lg text-primary-600' 
                              : 'ri-logout-circle-line text-lg text-red-600'
                          }`}></i>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.isActive || !entry.clockOut ? 'Punched In' : 'Punched Out'}
                          {entry.category && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {entry.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.isActive || !entry.clockOut
                            ? formatRelativeTime(entry.clockIn)
                            : formatRelativeTime(entry.clockOut!)}
                          {entry.description && (
                            <span className="ml-2 text-xs italic">
                              {entry.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No recent activities
              </li>
            )}
          </ul>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">View all activities</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
