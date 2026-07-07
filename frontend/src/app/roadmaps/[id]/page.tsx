'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUserStore } from '@/store/user-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Loader2, 
  ChevronLeft, 
  Clock, 
  Map, 
  BookOpen, 
  Video, 
  ExternalLink,
  Code,
  FolderOpen,
  Send,
  CheckCircle,
  HelpCircle,
  FileCheck,
  FileText,
  ChevronRight,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration } from '@/components/dashboard-upgrades/celebration-provider';

interface DailyTask {
  dayNumber: number;
  title: string;
  description: string;
  codingPractice?: string;
  status: 'pending' | 'completed';
  links?: ResourceLink[];
}

interface ResourceLink {
  title: string;
  url: string;
  type: string;
}

interface ProjectBrief {
  title: string;
  description: string;
  techStack: string[];
  difficulty: string;
  estimatedHours: number;
  folderStructure?: string;
  deploymentGuide?: string;
}

interface WeeklyMilestone {
  weekNumber: number;
  title: string;
  description: string;
  learningGoals: string[];
  dailyTasks: DailyTask[];
  resources: ResourceLink[];
  projects: ProjectBrief[];
}

interface MonthlyMilestone {
  monthNumber: number;
  title: string;
  description: string;
  weeks: WeeklyMilestone[];
}

interface RoadmapDetail {
  _id: string;
  title: string;
  targetRole: string;
  difficulty: string;
  estimatedDuration: string;
  skillsCovered: string[];
  timeline: MonthlyMilestone[];
  progressPercent: number;
}

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { id } = use(params);
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<ProjectBrief | null>(null);
  const [adapting, setAdapting] = useState(false);
  
  // Custom Timeline nodes states
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 1: true });
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({ '1-1': true });

  const { triggerTaskCompleted } = useCelebration();

  const toggleMonth = (mNum: number) => {
    setExpandedMonths((prev) => ({ ...prev, [mNum]: !prev[mNum] }));
  };

  const toggleWeek = (mNum: number, wNum: number) => {
    const key = `${mNum}-${wNum}`;
    setExpandedWeeks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCalendarExport = async () => {
    try {
      const res = await api.get(`/roadmaps/${id}/calendar`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/calendar' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `roadmap-${id}.ics`;
      link.click();
      toast.success('Calendar file downloaded! You can import it to Google Calendar.');
    } catch (err) {
      toast.error('Failed to export calendar.');
    }
  };

  const handleAdapt = async () => {
    const isPremium = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'premium';
    if (!isPremium) {
      toast.error('AI adaptation is a Premium Pro feature. Upgrade to unlock adaptive roadmap adjustments!', {
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/settings')
        }
      });
      return;
    }
    setAdapting(true);
    try {
      const res = await api.post(`/roadmaps/${id}/adapt`);
      setRoadmap(res.data.roadmap);
      toast.success('Roadmap adjusted by AI based on your metrics!');
    } catch (err) {
      toast.error('Failed to adapt roadmap.');
    } finally {
      setAdapting(false);
    }
  };

  const fetchRoadmapDetails = async () => {
    try {
      const res = await api.get(`/roadmaps/${id}`);
      setRoadmap(res.data.roadmap);
    } catch (err) {
      toast.error('Failed to load roadmap details.');
      router.push('/roadmaps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapDetails();
  }, [id]);

  const handleToggleTask = async (
    monthNumber: number,
    weekNumber: number,
    dayNumber: number,
    currentStatus: 'pending' | 'completed'
  ) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.put(`/roadmaps/${id}/task`, {
        monthNumber,
        weekNumber,
        dayNumber,
        status: nextStatus,
      });
      setRoadmap(res.data.roadmap);
      if (nextStatus === 'completed') {
        triggerTaskCompleted();
        toast.success('Completed! +15 XP Gained.');
      } else {
        toast.info('Task marked incomplete.');
      }
    } catch (err) {
      toast.error('Failed to update task state.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!roadmap) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto select-none">
        
        {/* TOP BAR / BACK LINK */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/roadmaps" className="p-2 border border-border bg-card/45 hover:bg-muted/40 rounded-lg text-muted-foreground hover:text-foreground transition-all shrink-0">
              <ChevronLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h2 className="text-lg md:text-2xl font-bold">{roadmap.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-bold">Structured study guide targeting {roadmap.targetRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCalendarExport}
              className="px-3 py-2 border border-border bg-card/20 hover:bg-muted/40 rounded-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Calendar Sync</span>
            </button>

            <button
              onClick={handleAdapt}
              disabled={adapting}
              className="px-3 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {adapting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Adapt Roadmap</span>
            </button>
          </div>
        </div>

        {/* PROGRESS METRICS */}
        <div className="p-4 md:p-6 rounded-2xl glass-card grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 items-center">
          <div className="sm:col-span-2 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Overall Roadmap Completion</span>
              <span>{roadmap.progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${roadmap.progressPercent}%` }} />
            </div>
          </div>

          <div className="flex justify-around text-center text-xs font-semibold text-muted-foreground sm:border-l border-border/40 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 h-full items-center">
            <div>
              <Clock className="w-4.5 h-4.5 text-primary mx-auto mb-1" />
              <span>{roadmap.estimatedDuration}</span>
            </div>
            <div>
              <Map className="w-4.5 h-4.5 text-accent mx-auto mb-1" />
              <span className="capitalize">{roadmap.difficulty}</span>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="space-y-8">
          {roadmap.timeline.map((month) => {
            const isMonthExpanded = !!expandedMonths[month.monthNumber];
            return (
              <div key={month.monthNumber} className="space-y-4 rounded-2xl border border-border/50 bg-card/5 overflow-hidden">
                
                {/* Month Header Banner */}
                <div 
                  onClick={() => toggleMonth(month.monthNumber)}
                  className="p-5 bg-card/30 flex items-center justify-between cursor-pointer hover:bg-muted/10 transition-colors select-none"
                >
                  <div>
                    <h3 className="font-extrabold text-base text-primary">Month {month.monthNumber}: {month.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-bold">{month.description}</p>
                  </div>
                  <div className="text-muted-foreground">
                    {isMonthExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Weeks timeline */}
                <AnimatePresence initial={false}>
                  {isMonthExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-8 pr-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-6"
                    >
                      {month.weeks.map((week) => {
                        const weekKey = `${month.monthNumber}-${week.weekNumber}`;
                        const isWeekExpanded = !!expandedWeeks[weekKey];
                        
                        return (
                          <div key={week.weekNumber} className="relative space-y-3 pt-1 select-none">
                            
                            {/* Circle timeline bullet */}
                            <div className="absolute -left-[41px] top-2.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                            <div 
                              onClick={() => toggleWeek(month.monthNumber, week.weekNumber)}
                              className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors py-1"
                            >
                              <div>
                                <h4 className="font-bold text-sm text-foreground/90">Week {week.weekNumber}: {week.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 font-medium">{week.description}</p>
                              </div>
                              <div className="text-muted-foreground">
                                {isWeekExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {isWeekExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start pt-2">
                      
                      {/* Daily Tasks Checkbox list */}
                      <div className="md:col-span-2 p-4 rounded-xl border border-border bg-card/15 space-y-3">
                        <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          <span>Daily Study Task Check</span>
                        </span>

                        <div className="space-y-2">
                          {week.dailyTasks.map((task) => {
                            const completed = task.status === 'completed';
                            return (
                              <div 
                                key={task.dayNumber}
                                onClick={() => handleToggleTask(month.monthNumber, week.weekNumber, task.dayNumber, task.status)}
                                className={`
                                  p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-start gap-3
                                  ${completed 
                                    ? 'border-green-500/20 bg-green-500/5 text-green-600/90 line-through' 
                                    : 'border-border/40 hover:bg-muted/30'}
                                `}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={completed}
                                  readOnly
                                  className="w-4 h-4 rounded text-primary focus:ring-primary mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold">Day {task.dayNumber}: {task.title}</p>
                                  <p className="text-muted-foreground text-[10px] line-through-none mt-0.5">{task.description}</p>
                                  
                                  {task.codingPractice && (
                                    <div className="mt-2 p-2 bg-muted/20 border border-border/30 rounded text-[10px] font-mono text-foreground/80">
                                      <span className="font-bold text-primary">Practice:</span> {task.codingPractice}
                                    </div>
                                  )}

                                  {task.links && task.links.length > 0 ? (
                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                      {task.links.map((link, lIdx) => {
                                        // Resolve URL safely to prevent dead links
                                        let resolvedUrl = link.url;
                                        const isYoutube = link.type === 'youtube' || resolvedUrl.includes('youtube.com') || resolvedUrl.includes('youtu.be');
                                        
                                        if (isYoutube) {
                                          resolvedUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(link.title)}`;
                                        } else {
                                          // For docs or notes, if it's a deep link, redirect to Google Search for the topic to prevent 404s
                                          try {
                                            const parsed = new URL(resolvedUrl);
                                            const isRoot = parsed.pathname === '/' || parsed.pathname === '';
                                            if (!isRoot) {
                                              resolvedUrl = `https://www.google.com/search?q=${encodeURIComponent(link.title)}`;
                                            }
                                          } catch {
                                            resolvedUrl = `https://www.google.com/search?q=${encodeURIComponent(link.title)}`;
                                          }
                                        }

                                        return (
                                          <a
                                            key={lIdx}
                                            href={resolvedUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 text-[9px] font-bold text-primary transition-all active:scale-95 cursor-pointer shrink-0"
                                          >
                                            {isYoutube ? (
                                              <Video className="w-3 h-3 text-red-500 shrink-0" />
                                            ) : link.type === 'notes' ? (
                                              <FileText className="w-3 h-3 text-yellow-500 shrink-0" />
                                            ) : (
                                              <ExternalLink className="w-3 h-3 shrink-0" />
                                            )}
                                            <span>{link.title}</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(task.title + ' documentation')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/40 border border-border/60 hover:bg-muted text-[9px] font-bold text-muted-foreground transition-all active:scale-95 cursor-pointer shrink-0"
                                      >
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span>Search Docs</span>
                                      </a>
                                      <a
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(task.title + ' tutorial')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/40 border border-border/60 hover:bg-muted text-[9px] font-bold text-muted-foreground transition-all active:scale-95 cursor-pointer shrink-0"
                                      >
                                        <Video className="w-3 h-3 text-red-500 shrink-0" />
                                        <span>Search Video</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
 
                      {/* Side references & project links */}
                      <div className="space-y-4">
                        
                        {/* Curated Resources (Fallback for older roadmaps) */}
                        {week.resources && week.resources.length > 0 && (
                          <div className="p-4 rounded-xl border border-border bg-card/15 space-y-3">
                            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-accent" />
                              <span>Study Guides (Week Resources)</span>
                            </span>
 
                            <div className="space-y-2 text-xs font-semibold">
                              {week.resources.map((resItem, rIdx) => {
                                let resolvedResUrl = resItem.url;
                                const isYoutube = resItem.type === 'youtube' || resolvedResUrl.includes('youtube.com') || resolvedResUrl.includes('youtu.be');

                                if (isYoutube) {
                                  resolvedResUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(resItem.title)}`;
                                } else {
                                  try {
                                    const parsed = new URL(resolvedResUrl);
                                    const isRoot = parsed.pathname === '/' || parsed.pathname === '';
                                    if (!isRoot) {
                                      resolvedResUrl = `https://www.google.com/search?q=${encodeURIComponent(resItem.title)}`;
                                    }
                                  } catch {
                                    resolvedResUrl = `https://www.google.com/search?q=${encodeURIComponent(resItem.title)}`;
                                  }
                                }

                                return (
                                  <a
                                    key={rIdx}
                                    href={resolvedResUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2.5 rounded border border-border/40 hover:bg-muted/40 transition-colors"
                                  >
                                    <span className="truncate pr-2">{resItem.title}</span>
                                    {isYoutube ? (
                                      <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    ) : resItem.type === 'notes' ? (
                                      <FileText className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                    ) : (
                                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recommended projects */}
                        {week.projects && week.projects.length > 0 && (
                          <div className="p-4 rounded-xl border border-border bg-card/15 space-y-3">
                            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                              <Code className="w-3.5 h-3.5 text-green-500" />
                              <span>Coding Project</span>
                            </span>

                            <div className="space-y-2">
                              {week.projects.map((proj, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => setActiveProject(proj)}
                                  className="w-full text-left p-3 rounded border border-border/40 hover:bg-muted/40 transition-colors text-xs font-semibold flex items-center justify-between cursor-pointer"
                                >
                                  <span>{proj.title}</span>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    )}
  </AnimatePresence>
</div>
);
})}
</div>

{/* DETAILED PROJECT EXPLORER DRAWER MODAL */}
{activeProject && (() => {
const project = activeProject;
return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
  <div className="w-full max-w-2xl bg-card rounded-2xl border border-border overflow-hidden shadow-2xl animate-scale-up">
    
    {/* Modal Header */}
    <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
      <div>
        <div className="flex gap-2 items-center mb-1">
          <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {project.difficulty}
          </span>
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.estimatedHours} Hours</span>
          </span>
        </div>
        <h3 className="text-lg md:text-xl font-bold">{project.title}</h3>
      </div>
      <button 
        onClick={() => setActiveProject(null)} 
        className="p-2 border border-border hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
      >
        ✕
      </button>
    </div>

    {/* Modal Content */}
    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-sm font-semibold">
      <div>
        <h4 className="text-xs uppercase text-muted-foreground tracking-wider mb-1 font-extrabold">Description</h4>
        <p className="text-foreground/90 font-medium leading-relaxed">{project.description}</p>
      </div>

      <div>
        <h4 className="text-xs uppercase text-muted-foreground tracking-wider mb-1.5 font-extrabold">Tech Stack</h4>
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map((tech, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted border border-border/40 rounded text-xs font-semibold text-foreground/80">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {project.folderStructure && (
        <div>
          <h4 className="text-xs uppercase text-muted-foreground tracking-wider mb-1.5 font-extrabold flex items-center gap-1">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span>Folder Structure Directory Tree</span>
          </h4>
          <pre className="p-3 bg-muted/40 border border-border/30 rounded-lg text-[10px] font-mono leading-relaxed text-foreground/80 overflow-x-auto">
            {project.folderStructure}
          </pre>
        </div>
      )}

      {project.deploymentGuide && (
        <div>
          <h4 className="text-xs uppercase text-muted-foreground tracking-wider mb-1.5 font-extrabold flex items-center gap-1">
            <Send className="w-4 h-4 text-accent" />
            <span>Deployment Guide Instructions</span>
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
            {project.deploymentGuide}
          </p>
        </div>
      )}
    </div>

    {/* Modal Action */}
    <div className="p-4 border-t border-border bg-muted/5 flex justify-end">
      <button 
        onClick={() => setActiveProject(null)} 
        className="px-5 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 cursor-pointer"
      >
        Close Explorer
      </button>
    </div>

  </div>
</div>
);
})()}

      </div>
    </DashboardLayout>
  );
}
