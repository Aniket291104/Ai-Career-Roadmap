'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Trophy, 
  Flame, 
  Loader2, 
  ShieldAlert,
  Award,
  Users,
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  _id: string;
  name: string;
  xpPoints: number;
  currentStreak: number;
  role: string;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<'global' | 'college' | 'friends'>('global');
  const [filterTime, setFilterTime] = useState<'weekly' | 'monthly' | 'all'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/leaderboard');
        setLeaders(res.data.leaderboard);
      } catch (err) {
        toast.error('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [filterScope, filterTime]);

  const top3 = leaders.slice(0, 3);
  const remaining = leaders.slice(3);

  // Pedestal order: 2nd place (left), 1st place (center), 3rd place (right)
  const pedestalItems = [
    { place: 1, user: top3[1], rank: '2nd', color: 'border-slate-400 bg-slate-500/10 text-slate-400', emoji: '🥈', delay: 0.1, height: 'h-40' },
    { place: 0, user: top3[0], rank: '1st', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', emoji: '🥇', delay: 0.0, height: 'h-48' },
    { place: 2, user: top3[2], rank: '3rd', color: 'border-amber-700 bg-amber-800/10 text-amber-600', emoji: '🥉', delay: 0.2, height: 'h-32' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 select-none">
        
        {/* HEADER HERO */}
        <div className="p-6 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Gamified Leaderboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Scale the rank dashboard! Code challenges, quiz accuracy, and tasks earn daily XP.</p>
            </div>
          </div>

          {/* Double Filter Switches */}
          <div className="flex flex-col gap-2.5 w-full md:w-auto">
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30 text-[10px] font-bold">
              {['global', 'college', 'friends'].map((scope) => (
                <button
                  key={scope}
                  onClick={() => setFilterScope(scope as any)}
                  className={`
                    px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer
                    ${filterScope === scope ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {scope}
                </button>
              ))}
            </div>

            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30 text-[10px] font-bold">
              {['all', 'monthly', 'weekly'].map((time) => (
                <button
                  key={time}
                  onClick={() => setFilterTime(time as any)}
                  className={`
                    flex-1 px-3 py-1 rounded-lg capitalize transition-all text-center cursor-pointer
                    ${filterTime === time ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground animate-pulse">Calculating score hierarchies...</span>
          </div>
        ) : leaders.length > 0 ? (
          <div className="space-y-8">
            
            {/* TOP 3 PEDESTAL */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 items-end select-none">
                {pedestalItems.map((item, idx) => {
                  const itemUser = item.user;
                  if (!itemUser) return null;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.delay, type: 'spring', stiffness: 100 }}
                      className="flex flex-col items-center"
                    >
                      {/* Floating Profile Balloon */}
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 3 + idx, ease: 'easeInOut' }}
                        className="flex flex-col items-center mb-3 text-center"
                      >
                        <div className={`w-14 h-14 rounded-full bg-primary/20 border-2 ${item.color.split(' ')[0]} flex items-center justify-center font-bold text-base relative shadow-lg`}>
                          {itemUser.name.slice(0, 2).toUpperCase()}
                          <span className="absolute -top-2.5 -right-1 text-lg">{item.emoji}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground mt-2 truncate w-24 block">{itemUser.name}</span>
                        <span className="text-[9px] font-extrabold text-muted-foreground tracking-wider uppercase">{itemUser.role}</span>
                      </motion.div>

                      {/* Pedestal block */}
                      <div className={`w-full ${item.height} ${item.color.split(' ').slice(1).join(' ')} border border-b-0 rounded-t-2xl flex flex-col items-center justify-center p-3 relative`}>
                        <span className={`text-2xl font-extrabold block ${item.color.split(' ')[2]}`}>
                          {item.rank}
                        </span>
                        <span className="text-[10px] font-bold text-foreground mt-1.5">
                          {itemUser.xpPoints} XP
                        </span>
                        <span className="text-[8px] text-orange-400 font-extrabold flex items-center gap-0.5 mt-1">
                          <Flame className="w-2.5 h-2.5 fill-orange-400/10" />
                          {itemUser.currentStreak}d
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* REMAINING LEADERS LIST */}
            {remaining.length > 0 && (
              <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/15 shadow-lg max-w-3xl mx-auto">
                <div className="bg-muted/30 border-b border-border/30 px-6 py-3 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex justify-between select-none">
                  <div className="flex gap-12">
                    <span>Rank</span>
                    <span>Student User</span>
                  </div>
                  <div className="flex gap-16 pr-4">
                    <span>Streak</span>
                    <span>Badges</span>
                    <span>XP Points</span>
                  </div>
                </div>

                <div className="divide-y divide-border/20">
                  {remaining.map((leader, index) => {
                    const actualRank = index + 4;
                    
                    return (
                      <motion.div
                        key={leader._id}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors"
                      >
                        {/* Rank & User Info */}
                        <div className="flex items-center gap-8">
                          <span className="text-xs font-bold text-muted-foreground w-6">
                            #{actualRank}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shadow-sm">
                              {leader.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-sm block">{leader.name}</span>
                              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{leader.role}</span>
                            </div>
                          </div>
                        </div>

                        {/* Streak, Badges, XP Info */}
                        <div className="flex items-center gap-12 pr-2 text-right">
                          {/* Streak */}
                          <div className="flex items-center gap-1 text-orange-500 font-bold text-xs w-16 justify-end">
                            <Flame className="w-3.5 h-3.5 fill-orange-500/10" />
                            <span>{leader.currentStreak}d</span>
                          </div>

                          {/* Badges — shows streak-based icon */}
                          <div className="flex items-center gap-0.5 text-xs text-yellow-500 font-bold w-12 justify-end">
                            <span>🔥</span>
                          </div>

                          {/* XP */}
                          <span className="text-xs font-extrabold text-primary w-20 justify-end flex">
                            {leader.xpPoints} XP
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="font-bold text-sm">Empty Leaderboard</h4>
            <p className="text-xs text-muted-foreground mt-1">Check back later once learning tasks have been compiled.</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
