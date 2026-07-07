'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/user-store';
import { api } from '@/lib/api';
import { 
  LayoutDashboard, 
  Map, 
  Kanban, 
  FileText, 
  UserCheck, 
  MessageSquare, 
  Trophy, 
  Settings, 
  Flame, 
  Award,
  Loader2,
  Menu,
  X,
  Compass,
  Code2
} from 'lucide-react';
import { Github } from '@/components/icons';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import { BrandLogo } from '@/components/logo';

// Dashboard Premium Upgrades
import { FloatingAIAssistant } from '@/components/dashboard-upgrades/floating-ai-assistant';
import { NotificationCenter } from '@/components/dashboard-upgrades/notification-center';
import { GlobalSearch } from '@/components/dashboard-upgrades/global-search';
import { ThemeSwitcher } from '@/components/dashboard-upgrades/theme-switcher';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, loading, setUser, logout } = useUserStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        logout();
        router.push('/login');
      }
    };

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isPaymentUpdate = searchParams.get('payment') || searchParams.get('success');
      if (isPaymentUpdate) {
        fetchProfile();
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        return;
      }
    }

    if (!isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, setUser, logout, router]);

  useEffect(() => {
    if (isLoggedIn) {
      socket.connect();

      socket.on('notification', (data: any) => {
        toast.info(data.message || 'New live update received!');
      });

      return () => {
        socket.off('notification');
        socket.disconnect();
      };
    }
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // RPG Level Calculations
  const xp = user?.xpPoints || 0;
  const currentLevel = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const nextLevelXp = 1000;
  const levelProgressPercent = Math.min((currentLevelXp / nextLevelXp) * 100, 100);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Skill Quiz', path: '/assessment', icon: Trophy },
    { name: 'Coding Sandbox', path: '/coding-assessment', icon: Code2 },
    { name: 'AI Roadmaps', path: '/roadmaps', icon: Map },
    { name: 'Skill Tree', path: '/skill-tree', icon: Compass },
    { name: 'Task Board', path: '/tasks', icon: Kanban },
    { name: 'Resume Scan', path: 'https://hireboost1.vercel.app', icon: FileText },
    { name: 'GitHub Review', path: '/portfolio-analyzer', icon: Github },
    { name: 'Mock Interview', path: '/mock-interview', icon: UserCheck },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-screen bg-background text-foreground flex relative overflow-hidden">

      {/* SIDEBAR PANEL — z-50 so it slides over everything on mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-border/40 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:relative md:flex-shrink-0 h-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6 flex flex-col min-h-0">
          {/* Logo */}
          <BrandLogo />

          {/* Navigation */}
          <nav className="space-y-1 overflow-y-auto flex-1 pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              const isExternal = item.path.startsWith('http');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${active 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card/25">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate">{user?.name}</h4>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Dark backdrop overlay — tap to close sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* TOP BAR */}
        <header className="h-16 border-b border-border flex items-center justify-between px-3 md:px-6 bg-card/10 backdrop-blur z-20 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">

            {/* ☰ Hamburger — inside the header, left side, mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden shrink-0 p-2 rounded-xl border border-border/60 hover:bg-muted/40 text-foreground transition-all active:scale-95"
              aria-label="Open navigation menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <h1 className="font-display font-extrabold text-sm md:text-xl capitalize text-foreground truncate">
              {pathname.substring(1).split('/')[0].replace(/-/g, ' ') || 'Dashboard'}
            </h1>

            {/* Global Search — hidden on very small mobile */}
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">

            {/* XP Level Bar — lg+ only */}
            <div className="hidden lg:flex flex-col items-end gap-1 w-44">
              <div className="flex justify-between w-full text-[10px] font-bold text-muted-foreground">
                <span>LEVEL {currentLevel}</span>
                <span>{currentLevelXp} / {nextLevelXp} XP</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
            </div>

            {/* XP Badge */}
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-500 font-bold" title="Total Experience Points">
              <Award className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{xp} XP</span>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs text-orange-500 font-bold" title="Current Daily Streak">
              <Flame className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{user?.currentStreak || 0} Days</span>
            </div>

            {/* Notification bell */}
            <NotificationCenter />

            {/* Theme toggle */}
            <ThemeSwitcher />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Global Floating AI Assistant Widget */}
      <FloatingAIAssistant />
    </div>
  );
}
