'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useCelebration } from '@/components/dashboard-upgrades/celebration-provider';
import { 
  Flame, 
  MapPin, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Trophy, 
  TrendingUp, 
  Compass, 
  ArrowRight,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RefreshCw,
  Sparkles,
  Users,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardData {
  user: {
    id: string;
    name: string;
    currentStreak: number;
    maxStreak: number;
    xpPoints: number;
    careerGoal?: string;
    skills: string[];
  };
  progress: {
    dailyActivity: { date: string; count: number }[];
    radarMetrics: { subject: string; score: number }[];
    consistencyScore: number;
  };
  activeRoadmap: any | null;
  tasksInfo: {
    total: number;
    completed: number;
    percent: number;
  };
  achievements: any[];
  codingStats?: {
    platform: string;
    username: string;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: string;
  } | null;
}

interface Widget {
  id: string;
  title: string;
  visible: boolean;
  size: 'sm' | 'md' | 'lg' | 'full';
}

interface FeedItem {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const { triggerConfetti, triggerTaskCompleted, triggerLevelUp } = useCelebration();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [layout, setLayout] = useState<Widget[]>([
    { id: 'streak', title: 'Active Streak', visible: true, size: 'sm' },
    { id: 'xp', title: 'Experience Points', visible: true, size: 'sm' },
    { id: 'tasks', title: 'Tasks Progress', visible: true, size: 'sm' },
    { id: 'consistency', title: 'Consistency Score', visible: true, size: 'sm' },
    { id: 'leetcode', title: 'LeetCode Stats', visible: true, size: 'full' },
    { id: 'goal', title: 'Active Roadmap Goal', visible: true, size: 'md' },
    { id: 'radar', title: 'Skills Radar Evaluation', visible: true, size: 'sm' },
    { id: 'calendar', title: 'Activity Heatmap Calendar', visible: true, size: 'md' },
    { id: 'badges', title: 'Unlocked Badges', visible: true, size: 'sm' },
    { id: 'feed', title: 'Live Activity Feed', visible: true, size: 'sm' },
  ]);

  // Real activity feed from backend
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Load stats and layout preference
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data);

        // Build real activity feed from user's own data
        const realFeed: FeedItem[] = [];
        if (res.data?.activeRoadmap) {
          realFeed.push({
            id: 'r1',
            user: res.data.user?.name || 'You',
            action: `active roadmap: ${res.data.activeRoadmap.title}`,
            time: 'Active',
            icon: '🗺️',
            color: 'text-primary',
          });
        }
        if (res.data?.tasksInfo?.completed > 0) {
          realFeed.push({
            id: 'r2',
            user: res.data.user?.name || 'You',
            action: `completed ${res.data.tasksInfo.completed} tasks so far`,
            time: 'Total',
            icon: '✅',
            color: 'text-green-400',
          });
        }
        if (res.data?.user?.currentStreak > 0) {
          realFeed.push({
            id: 'r3',
            user: res.data.user?.name || 'You',
            action: `on a ${res.data.user.currentStreak}-day learning streak 🔥`,
            time: 'Streak',
            icon: '🔥',
            color: 'text-orange-400',
          });
        }
        if (res.data?.user?.xpPoints > 0) {
          realFeed.push({
            id: 'r4',
            user: res.data.user?.name || 'You',
            action: `earned ${res.data.user.xpPoints} XP points total`,
            time: 'XP',
            icon: '⚡',
            color: 'text-yellow-400',
          });
        }
        if (realFeed.length > 0) setFeedItems(realFeed);
      } catch (err) {
        toast.error('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    const savedLayout = localStorage.getItem('dashboard_widget_layout');
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse saved layout preference:', e);
      }
    }

    fetchStats();
  }, []);

  const saveLayout = (newLayout: Widget[]) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard_widget_layout', JSON.stringify(newLayout));
  };

  const toggleWidgetVisibility = (id: string) => {
    const updated = layout.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveLayout(updated);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...layout];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    saveLayout(updated);
  };

  const resetLayout = () => {
    const defaults: Widget[] = [
      { id: 'streak', title: 'Active Streak', visible: true, size: 'sm' },
      { id: 'xp', title: 'Experience Points', visible: true, size: 'sm' },
      { id: 'tasks', title: 'Tasks Progress', visible: true, size: 'sm' },
      { id: 'consistency', title: 'Consistency Score', visible: true, size: 'sm' },
      { id: 'leetcode', title: 'LeetCode Stats', visible: true, size: 'full' },
      { id: 'goal', title: 'Active Roadmap Goal', visible: true, size: 'md' },
      { id: 'radar', title: 'Skills Radar Evaluation', visible: true, size: 'sm' },
      { id: 'calendar', title: 'Activity Heatmap Calendar', visible: true, size: 'md' },
      { id: 'badges', title: 'Unlocked Badges', visible: true, size: 'sm' },
      { id: 'feed', title: 'Live Activity Feed', visible: true, size: 'sm' },
    ];
    saveLayout(defaults);
    toast.success('Dashboard layout restored to default configuration.');
  };

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground animate-pulse">Syncing career matrices...</span>
        </div>
      </DashboardLayout>
    );
  }

  const renderHeatmap = () => {
    const squares = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      
      const activeItem = data.progress.dailyActivity.find(
        (act) => new Date(act.date).toDateString() === dateStr
      );

      const count = activeItem ? activeItem.count : 0;
      let bg = 'bg-muted/30';
      if (count === 1) bg = 'bg-primary/30 shadow-sm shadow-primary/5';
      else if (count === 2) bg = 'bg-primary/60 shadow-sm shadow-primary/10';
      else if (count >= 3) bg = 'bg-primary shadow shadow-primary/20';

      squares.push(
        <div 
          key={i} 
          className={`w-7 h-7 rounded-lg ${bg} transition-all duration-300 hover:scale-110 flex items-center justify-center text-[10px] font-bold text-white border border-border/10 cursor-pointer`}
          title={`${date.toLocaleDateString()}: ${count} activities completed`}
        >
          {count > 0 ? count : ''}
        </div>
      );
    }
    return squares;
  };

  const getColSpan = (size: string) => {
    switch (size) {
      case 'sm': return 'lg:col-span-1';
      case 'md': return 'lg:col-span-2';
      case 'lg': return 'lg:col-span-2';
      case 'full':
      default:
        return 'lg:col-span-3';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* CUSTOMIZE DASHBOARD CONTROLS */}
        <div className="flex items-center justify-between p-4 rounded-2xl glass-panel bg-card/10 select-none">
          <div className="flex items-center gap-2">
            <Settings className={`w-4.5 h-4.5 text-primary ${isCustomizing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold">Personalize Workspace Layout</span>
          </div>
          <div className="flex items-center gap-3">
            {isCustomizing && (
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 text-[10px] font-bold flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`
                px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95 cursor-pointer
                ${isCustomizing 
                  ? 'bg-primary text-white shadow-primary/10' 
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'}
              `}
            >
              {isCustomizing ? 'Done Customizing' : 'Customize Widgets'}
            </button>
          </div>
        </div>

        {/* CUSTOMIZATION WIDGET PICKER */}
        <AnimatePresence>
          {isCustomizing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 rounded-2xl border border-dashed border-border/80 bg-card/10 grid grid-cols-2 sm:grid-cols-5 gap-3.5 select-none">
                {layout.map((widget) => (
                  <div
                    key={widget.id}
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className={`
                      p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-20 active:scale-95
                      ${widget.visible 
                        ? 'bg-primary/5 border-primary/30 text-foreground' 
                        : 'bg-muted/10 border-border/40 text-muted-foreground/60'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold truncate pr-1">{widget.title}</span>
                      {widget.visible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />}
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded w-max border border-border/20">
                      {widget.size} width
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WIDGET GRID LAYOUT */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {layout.map((widget, index) => {
            if (!widget.visible) return null;

            return (
              <motion.div
                key={widget.id}
                layout
                className={`
                  rounded-2xl transition-all relative group/card
                  ${getColSpan(widget.size)}
                  ${isCustomizing ? 'border border-dashed border-primary/30 bg-primary/5' : ''}
                `}
              >
                {/* Drag / Position Controls in Customization Mode */}
                {isCustomizing && (
                  <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 bg-black/60 rounded-lg p-1 border border-border/40">
                    <button
                      disabled={index === 0}
                      onClick={() => moveWidget(index, 'up')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={index === layout.length - 1}
                      onClick={() => moveWidget(index, 'down')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* RENDER DYNAMIC WIDGETS */}
                {widget.id === 'streak' && (
                  <div className="p-6 rounded-2xl glass-card relative overflow-hidden flex items-center gap-4 h-full">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold">Active Streak</span>
                      <h3 className="text-2xl font-bold mt-1">{data.user.currentStreak} Days</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Best record: {data.user.maxStreak} days</p>
                    </div>
                  </div>
                )}

                {widget.id === 'xp' && (
                  <div className="p-6 rounded-2xl glass-card relative overflow-hidden flex items-center gap-4 h-full">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold">Experience Points</span>
                      <h3 className="text-2xl font-bold mt-1">{data.user.xpPoints} XP</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Earn points to unlock badges</p>
                    </div>
                  </div>
                )}

                {widget.id === 'tasks' && (
                  <div className="p-6 rounded-2xl glass-card relative overflow-hidden flex items-center gap-4 h-full">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold">Tasks Completed</span>
                      <h3 className="text-2xl font-bold mt-1">{data.tasksInfo.percent}%</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">{data.tasksInfo.completed} / {data.tasksInfo.total} tasks completed</p>
                    </div>
                  </div>
                )}

                {widget.id === 'consistency' && (
                  <div className="p-6 rounded-2xl glass-card relative overflow-hidden flex items-center gap-4 h-full">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold">Consistency Score</span>
                      <h3 className="text-2xl font-bold mt-1">{data.progress.consistencyScore}%</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Calculated on last 30-day activity</p>
                    </div>
                  </div>
                )}

                {widget.id === 'leetcode' && data.codingStats && (
                  <div className="p-6 rounded-2xl glass-card bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-500 font-extrabold text-sm tracking-wider">
                        LC
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">LeetCode Tracker: @{data.codingStats.username}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Global Ranking: #{data.codingStats.ranking}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Total</span>
                        <span className="block text-sm font-bold text-foreground mt-0.5">{data.codingStats.totalSolved}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Easy</span>
                        <span className="block text-sm font-bold text-green-500 mt-0.5">{data.codingStats.easySolved}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider font-extrabold">Med</span>
                        <span className="block text-sm font-bold text-yellow-500 mt-0.5">{data.codingStats.mediumSolved}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider font-extrabold">Hard</span>
                        <span className="block text-sm font-bold text-red-500 mt-0.5">{data.codingStats.hardSolved}</span>
                      </div>
                    </div>
                  </div>
                )}

                {widget.id === 'goal' && (
                  <div className="p-6 rounded-2xl glass-card flex flex-col justify-between h-full min-h-[300px]">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-xs text-primary font-bold uppercase tracking-wider">ACTIVE GOAL</span>
                          <h2 className="text-2xl font-bold mt-1">{data.activeRoadmap ? data.activeRoadmap.title : 'No Active Roadmap'}</h2>
                          <p className="text-xs text-muted-foreground mt-1 font-bold">Target: {data.user.careerGoal || 'Not selected yet'}</p>
                        </div>
                        {data.activeRoadmap && (
                          <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full font-semibold">
                            {data.activeRoadmap.difficulty}
                          </span>
                        )}
                      </div>

                      {data.activeRoadmap ? (
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-xs mb-2 font-semibold">
                              <span>Overall Progress</span>
                              <span>{data.activeRoadmap.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${data.activeRoadmap.progressPercent}%` }} />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-border/40 bg-card/25">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">SKILLS TARGETED</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {data.activeRoadmap.skillsCovered.map((skill: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 bg-muted/60 text-foreground/80 text-xs rounded-md font-semibold border border-border/30">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 space-y-4">
                          <Compass className="w-12 h-12 text-muted-foreground/40 mx-auto animate-spin-slow" />
                          <p className="text-xs text-muted-foreground">Setup your profile and skills assessment to generate your first roadmap.</p>
                          <Link href="/assessment" className="inline-flex items-center gap-2 text-primary hover:underline text-xs font-semibold">
                            <span>Take Assessment Quiz</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {data.activeRoadmap && (
                      <div className="mt-8 pt-4 border-t border-border/40 flex justify-end">
                        <Link href={`/roadmaps/${data.activeRoadmap._id}`} className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow-md shadow-primary/10 transition-all">
                          View Roadmap Timeline
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {widget.id === 'radar' && (
                  <div className="p-6 rounded-2xl glass-card flex flex-col justify-between items-center text-center h-full min-h-[300px]">
                    <div className="w-full text-left mb-4">
                      <span className="text-xs text-accent font-bold uppercase tracking-wider">SKILLS INDEX</span>
                      <h3 className="font-bold text-lg">Radar Evaluation</h3>
                    </div>

                    <div className="w-full h-64">
                      {data.progress.radarMetrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.progress.radarMetrics}>
                            <PolarGrid stroke="#27272a" />
                            <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={11} fontWeight="bold" />
                            <PolarRadiusAxis stroke="#27272a" angle={30} domain={[0, 100]} />
                            <Radar name="Skills" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          No assessment metrics available yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {widget.id === 'calendar' && (
                  <div className="p-6 rounded-2xl glass-card h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <span>Activity Calendar</span>
                      </h3>
                      
                      <p className="text-xs text-muted-foreground mb-4">
                        Consistency score calculates active calendar days. Completing tasks builds streaks.
                      </p>

                      <div className="flex flex-wrap gap-2.5 max-w-full overflow-x-auto py-2">
                        {renderHeatmap()}
                      </div>
                    </div>
                    
                    <div className="flex justify-end items-center gap-4 text-[10px] text-muted-foreground font-bold mt-4">
                      <span>Less</span>
                      <div className="flex gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm bg-muted/30" />
                        <div className="w-3.5 h-3.5 rounded-sm bg-primary/30" />
                        <div className="w-3.5 h-3.5 rounded-sm bg-primary/60" />
                        <div className="w-3.5 h-3.5 rounded-sm bg-primary" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                )}

                {widget.id === 'badges' && (
                  <div className="p-6 rounded-2xl glass-card space-y-4 h-full min-h-[300px]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span>Unlocked Badges</span>
                    </h3>

                    <div className="space-y-3.5 overflow-y-auto max-h-56 pr-1">
                      {data.achievements.length > 0 ? (
                        data.achievements.map((ach: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/10">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold text-sm">
                              ✨
                            </div>
                            <div>
                              <h4 className="text-xs font-bold">{ach.name}</h4>
                              <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{ach.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-muted-foreground font-bold leading-normal">
                          Earn streaks and build roadmaps to unlock achievements!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {widget.id === 'feed' && (
                  <div className="p-6 rounded-2xl glass-card h-full min-h-[300px] flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <span>Your Activity</span>
                      </h3>

                      {feedItems.length > 0 ? (
                        <div className="space-y-3">
                          <AnimatePresence initial={false}>
                            {feedItems.map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-start gap-2.5 p-2 rounded-lg border border-border/30 bg-muted/5 text-[10px] font-semibold"
                              >
                                <span className="text-sm shrink-0">{item.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <span className={`font-bold block truncate ${item.color}`}>{item.user}</span>
                                  <span className="text-muted-foreground font-medium">{item.action}</span>
                                </div>
                                <span className="text-[8px] text-muted-foreground/60 shrink-0 mt-0.5">{item.time}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                          <ArrowUpRight className="w-8 h-8 text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground font-semibold">No activity yet.<br />Complete tasks or generate a roadmap to get started.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-extrabold text-muted-foreground border-t border-border/30 pt-3 mt-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Your recent milestones</span>
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>



      </div>
    </DashboardLayout>
  );
}
