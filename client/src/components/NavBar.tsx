import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '@/hooks/use-auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Loader2, LogOut, User as UserIcon, Download } from 'lucide-react';
import { useLocation } from 'wouter';

interface NavBarProps {
  user: User | null;
  isLoading: boolean;
}

export function NavBar({ user, isLoading }: NavBarProps) {
  const { logoutMutation } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span 
                className="text-primary-600 font-bold text-xl cursor-pointer"
                onClick={() => navigate('/')}
              >
                TimeTrack
              </span>
            </div>
            
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <a 
                  href="/" 
                  onClick={(e) => { e.preventDefault(); navigate('/'); }}
                  className={`px-3 py-2 text-sm font-medium ${window.location.pathname === '/' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Dashboard
                </a>
                <a 
                  href="/reports" 
                  onClick={(e) => { e.preventDefault(); navigate('/reports'); }}
                  className={`px-3 py-2 text-sm font-medium ${window.location.pathname === '/reports' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Reports
                </a>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                {isLoading ? (
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        type="button" 
                        className="max-w-xs bg-gray-100 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        aria-expanded="false"
                        aria-haspopup="true"
                      >
                        <span className="sr-only">Open user menu</span>
                        <span className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">{user.initials}</span>
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      </div>
                      <DropdownMenuItem 
                        onClick={() => navigate('/reports')}
                        className="cursor-pointer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        <span>Reports</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        disabled={logoutMutation.isPending}
                        onClick={handleLogout}
                        className="cursor-pointer"
                      >
                        {logoutMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <UserIcon className="mr-1 h-4 w-4" />
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
