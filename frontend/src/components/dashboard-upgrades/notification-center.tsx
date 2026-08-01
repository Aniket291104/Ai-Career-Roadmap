'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, ShieldAlert, Award, Compass, MessageSquare, Briefcase, Sparkles, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user-store';

interface Notification {
  id: string;
  category: 'roadmap' | 'quiz' | 'achievement' | 'message' | 'alert' | 'suggestion';
  title: string;
  description: string;
  read: boolean;
  time: string;
}

export function NotificationCenter() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'updates' | 'messages' | 'alerts'>('all');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Mock initial notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      category: 'roadmap',
      title: 'Roadmap Adapted by AI',
      description: 'Your React Frontend Roadmap was adjusted to focus on Next.js 15 Turbopack rules.',
      read: false,
      time: '10m ago',
    },
    {
      id: 'n2',
      category: 'achievement',
      title: 'Badge Unlocked: React Master',
      description: 'You completed all React core tasks in less than 7 days. Claim +100 XP!',
      read: false,
      time: '2h ago',
    },
    {
      id: 'n3',
      category: 'message',
      title: 'Mentor Reply: John Doe',
      description: 'Reviewing your GitHub portfolios; looks solid, try adding unit testing examples.',
      read: true,
      time: '1d ago',
    },
    {
      id: 'n4',
      category: 'alert',
      title: 'New Internship Alert: Vercel',
      description: 'Vercel is looking for a Frontend Engineering Intern matching your skill metrics.',
      read: false,
      time: '2d ago',
    },
    {
      id: 'n5',
      category: 'suggestion',
      title: 'AI Suggestion: Learn Redis',
      description: 'Based on your backend assessment, learning Redis caching will boost interview scores.',
      read: true,
      time: '3d ago',
    },
  ]);

  // Settings
  const [preferences, setPreferences] = useState({
    push: true,
    email: true,
    weeklyReport: true,
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'roadmap':
        return <Compass className="w-4 h-4 text-primary" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-yellow-500 animate-bounce" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'alert':
        return <Briefcase className="w-4 h-4 text-green-500" />;
      case 'suggestion':
      default:
        return <Sparkles className="w-4 h-4 text-accent" />;
    }
  };

  // Filter Logic
  const getFiltered = () => {
    switch (activeTab) {
      case 'updates':
        return notifications.filter((n) => n.category === 'roadmap' || n.category === 'suggestion');
      case 'messages':
        return notifications.filter((n) => n.category === 'message');
      case 'alerts':
        return notifications.filter((n) => n.category === 'alert');
      case 'all':
      default:
        return notifications;
    }
  };

  const filtered = getFiltered();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
        }}
        className="p-2.5 rounded-xl border border-border bg-card/45 hover:bg-muted/40 transition-all focus:outline-none relative focus:ring-2 focus:ring-primary/40 cursor-pointer"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
          transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
        >
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center px-1 border border-background">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 left-3 right-3 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-3 sm:w-[400px] rounded-2xl bg-card shadow-2xl border border-border overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border select-none">
              <span className="text-xs font-bold tracking-wide text-foreground">Notifications</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                  title="Preferences"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-extrabold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {showSettings ? (
              /* Preferences Pane */
              <div className="p-4 space-y-4 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">Preferences</h4>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded"
                  >
                    Back
                  </button>
                </div>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-bold">Real-time Push</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Browser banner triggers.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.push}
                      onChange={() => setPreferences((p) => ({ ...p, push: !p.push }))}
                      className="rounded bg-muted border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-bold">Email Digest</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Receive direct alerts for mentor messages.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email}
                      onChange={() => setPreferences((p) => ({ ...p, email: !p.email }))}
                      className="rounded bg-muted border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-bold">Weekly Performance Report</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Streaks and XP logs email summaries.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyReport}
                      onChange={() => setPreferences((p) => ({ ...p, weeklyReport: !p.weeklyReport }))}
                      className="rounded bg-muted border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Notifications List Pane */
              <>
                {/* Tabs */}
                <div className="flex border-b border-border bg-muted/30 text-[10px] font-bold select-none">
                  {['all', 'updates', 'messages', 'alerts'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`
                        flex-1 py-2 capitalize transition-all border-b-2
                        ${activeTab === tab 
                          ? 'border-primary text-foreground font-extrabold' 
                          : 'border-transparent text-muted-foreground hover:text-foreground'}
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Notifications List */}
                <div className="max-h-[350px] overflow-y-auto divide-y divide-border/20">
                  {filtered.length > 0 ? (
                    filtered.map((item) => (
                      <div
                        key={item.id}
                        className={`
                          flex gap-3 p-4 relative group transition-colors
                          ${item.read ? 'bg-transparent' : 'bg-primary/5'}
                        `}
                      >
                        {/* Category Icon */}
                        <div className="w-8 h-8 rounded-lg border border-border bg-card/60 flex items-center justify-center shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className={`text-xs font-bold text-foreground ${item.read ? 'font-medium' : 'font-extrabold'}`}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{item.description}</p>
                          <span className="text-[9px] text-muted-foreground/60 font-semibold block mt-1.5">{item.time}</span>
                        </div>

                        {/* Action buttons — always visible on mobile, hover visible on desktop */}
                        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleRead(item.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors min-w-7 min-h-7 flex items-center justify-center"
                            title={item.read ? "Mark unread" : "Mark read"}
                            aria-label={item.read ? "Mark unread" : "Mark read"}
                          >
                            <Check className={`w-3.5 h-3.5 ${item.read ? 'text-muted-foreground' : 'text-green-500'}`} />
                          </button>
                          <button
                            onClick={() => deleteNotification(item.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-red-500 transition-colors min-w-7 min-h-7 flex items-center justify-center"
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
                      <span>No notifications in this category.</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-border bg-muted/40 text-center text-[10px] font-bold text-muted-foreground truncate">
                  Logged in as {user?.name || user?.email || 'User'}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
