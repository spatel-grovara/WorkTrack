import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  isLoading: boolean;
}

export function Layout({ children, user, isLoading }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} isLoading={isLoading} />
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
