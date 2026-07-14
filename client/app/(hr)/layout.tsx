'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  User,
  Bell,
  Building2,
  FileSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (pathname === '/auth/exchange') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        <h1 className="text-xl font-bold text-black">Unauthorized</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You must be logged into PerformX to access the recruitment workspace.
        </p>
        <Button
          onClick={() => (window.location.href = 'http://localhost:3000/auth/login')}
          className="mt-4 cursor-pointer font-semibold"
        >
          Login to PerformX
        </Button>
      </div>
    );
  }


  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Applications', icon: Briefcase, href: '/applications' },
    { label: 'Candidates', icon: Users, href: '/candidates' },
    { label: 'Departments', icon: Building2, href: '/departments' },
    { label: 'Interviews', icon: Calendar, href: '/interviews' },
    { label: 'Offers', icon: FileSignature, href: '/offers' },
    { label: 'Reports', icon: BarChart3, href: '/reports' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50/50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r transition-all duration-200",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Workspace Brand */}
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="rounded bg-primary text-primary-foreground p-1 shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            {sidebarOpen && <span className="font-bold text-black text-sm whitespace-nowrap">CareerX CRM</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-neutral-400 hover:text-black transition-colors rounded p-1 hover:bg-neutral-50 cursor-pointer hidden md:block"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors font-medium cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Workspace Info & Logout */}
        <div className="p-3 border-t bg-neutral-50/50 space-y-2">
          {sidebarOpen && (
            <div className="px-2 text-left">
              <p className="text-xs font-semibold text-black truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">HR Employee</p>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-medium",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-200",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        {/* Header Bar */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-neutral-500 hover:text-black block md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Recruitment Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-black transition-colors cursor-pointer relative p-1.5 hover:bg-neutral-50 rounded-full">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full" />
            </button>
            <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600 border select-none">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 bg-neutral-50/30 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
