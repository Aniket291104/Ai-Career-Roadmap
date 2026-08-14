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
  ChevronUp,
  Trophy
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'mindmap' | 'resources'>('timeline');

  // Interactive Quiz States
  const [activeQuizWeek, setActiveQuizWeek] = useState<{ monthNumber: number; weekNumber: number; title: string; skills: string[] } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState<{ scorePercent: number; questions: any[]; strongAreas: string[]; weakAreas: string[] } | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // AI Project Submission States
  const [activeSubmitProject, setActiveSubmitProject] = useState<ProjectBrief | null>(null);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectReviewResult, setProjectReviewResult] = useState<{ score: number; strengths: string[]; improvements: string[]; verdict: string } | null>(null);

  // Resources Explorer States
  const [searchResource, setSearchResource] = useState('');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'youtube' | 'docs' | 'notes'>('all');

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

  // Trigger Weekly Quiz
  const handleStartWeeklyQuiz = async (monthNumber: number, weekNumber: number, title: string, skills: string[]) => {
    setActiveQuizWeek({ monthNumber, weekNumber, title, skills });
    setQuizLoading(true);
    setQuizResults(null);
    setQuizCurrentIndex(0);
    setQuizAnswers([]);
    
    try {
      const res = await api.post('/quizzes/generate', {
        skills,
        goal: title
      });
      setQuizId(res.data.quizId);
      setQuizQuestions(res.data.questions);
      toast.success(`AI generated a quiz on: ${title}`);
    } catch (err) {
      toast.error('Failed to generate weekly quiz.');
      setActiveQuizWeek(null);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (quizAnswers.length < quizQuestions.length) {
      toast.warning('Please answer all questions before submitting.');
      return;
    }
    setQuizSubmitting(true);
    try {
      const res = await api.post('/quizzes/submit', {
        quizId,
        answers: quizAnswers
      });
      setQuizResults(res.data);
      triggerTaskCompleted();
      toast.success(`Quiz graded: ${res.data.scorePercent}% score! +30 XP Reward.`);
      
      // Update local XP total visually
      if (user) {
        user.xpPoints += 30;
      }
    } catch (err) {
      toast.error('Quiz evaluation failed.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Submit Project for AI Review
  const handleSubmitProjectReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectRepoUrl.trim()) {
      toast.error('Please enter your GitHub repository URL.');
      return;
    }
    setSubmittingProject(true);
    setProjectReviewResult(null);
    
    try {
      const res = await api.post(`/roadmaps/${id}/project/submit`, {
        projectTitle: activeSubmitProject?.title,
        repoUrl: projectRepoUrl,
        description: projectDescription
      });
      setProjectReviewResult(res.data.review);
      triggerTaskCompleted();
      toast.success(`Project evaluated! +50 XP Reward.`);
      
      // Update local XP total visually
      if (user) {
        user.xpPoints += 50;
      }
    } catch (err) {
      toast.error('AI code review failed to initialize. Please try again.');
    } finally {
      setSubmittingProject(false);
    }
  };

  // Extract all resources for Resources Hub
  const getAllResources = () => {
    if (!roadmap) return [];
    const allLinks: { title: string; url: string; type: string; origin: string }[] = [];
    
    roadmap.timeline.forEach((month) => {
      month.weeks.forEach((week) => {
        // Collect weekly resources
        if (week.resources) {
          week.resources.forEach((r) => {
            allLinks.push({ ...r, origin: `Month ${month.monthNumber}, Week ${week.weekNumber}` });
          });
        }
        // Collect daily tasks links
        week.dailyTasks.forEach((task) => {
          if (task.links) {
            task.links.forEach((l) => {
              allLinks.push({ ...l, origin: `Month ${month.monthNumber}, Week ${week.weekNumber} (Day ${task.dayNumber})` });
            });
          }
        });
      });
    });
    
    // Deduplicate
    const seen = new Set();
    return allLinks.filter((item) => {
      const k = `${item.title}-${item.url}`;
      return seen.has(k) ? false : seen.add(k);
    });
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

  const resourcesList = getAllResources();
  const filteredResources = resourcesList.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchResource.toLowerCase()) || r.origin.toLowerCase().includes(searchResource.toLowerCase());
    const matchesFilter = resourceFilter === 'all' || r.type === resourceFilter;
    return matchesSearch && matchesFilter;
  });

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
              <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                <span>{roadmap.title}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-bold">Structured AI target roadmap for {roadmap.targetRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCalendarExport}
              className="px-3 py-2 border border-border bg-card/20 hover:bg-muted/40 rounded-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Calendar Sync</span>
            </button>

            <button
              onClick={handleAdapt}
              disabled={adapting}
              className="px-3 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {adapting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Adapt Roadmap</span>
            </button>
          </div>
        </div>

        {/* METRICS & NAV TABS */}
        <div className="p-4 md:p-6 rounded-2xl glass-card flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Overall Roadmap Completion</span>
              <span>{roadmap.progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${roadmap.progressPercent}%` }} />
            </div>
          </div>

          {/* VIEW SELECTOR TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/20 rounded-xl">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'timeline' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Timeline View
            </button>
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'mindmap' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Visual Mindmap
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'resources' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Resources Hub
            </button>
          </div>
        </div>

        {/* MAIN VIEWS SWITCHER */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ACCORDION TIMELINE */}
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {roadmap.timeline.map((month) => {
                const isMonthExpanded = !!expandedMonths[month.monthNumber];
                return (
                  <div key={month.monthNumber} className="space-y-4 rounded-2xl border border-border/50 bg-card/5 overflow-hidden">
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
                                <div className="absolute -left-[41px] top-2.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                                <div 
                                  id={`week-header-${weekKey}`}
                                  onClick={() => toggleWeek(month.monthNumber, week.weekNumber)}
                                  className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors py-1"
                                >
                                  <div>
                                    <h4 className="font-bold text-sm text-foreground/90 flex items-center gap-2">
                                      <span>Week {week.weekNumber}: {week.title}</span>
                                    </h4>
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
                                          <div className="flex justify-between items-center border-b border-border/30 pb-2 mb-2">
                                            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                                              <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                              <span>Daily Study Task Check</span>
                                            </span>
                                            
                                            {/* Take Quiz Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartWeeklyQuiz(month.monthNumber, week.weekNumber, week.title, week.learningGoals);
                                              }}
                                              className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 border border-yellow-500/25 rounded text-[9px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                            >
                                              <Trophy className="w-3 h-3 text-yellow-500" />
                                              <span>Take Week Quiz</span>
                                            </button>
                                          </div>

                                          <div className="space-y-2">
                                            {week.dailyTasks.map((task) => {
                                              const completed = task.status === 'completed';
                                              return (
                                                <div 
                                                  key={task.dayNumber}
                                                  onClick={() => handleToggleTask(month.monthNumber, week.weekNumber, task.dayNumber, task.status)}
                                                  className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-start gap-3 ${completed ? 'border-green-500/20 bg-green-500/5 text-green-600/95 line-through' : 'border-border/40 hover:bg-muted/30'}`}
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

                                                    {task.links && task.links.length > 0 && (
                                                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                        {task.links.map((link, lIdx) => {
                                                          const isYoutube = link.type === 'youtube' || link.url.includes('youtube.com') || link.url.includes('youtu.be');
                                                          let resolvedUrl = link.url;
                                                          if (isYoutube) {
                                                            resolvedUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(link.title)}`;
                                                          }
                                                          return (
                                                            <a
                                                              key={lIdx}
                                                              href={resolvedUrl}
                                                              target="_blank"
                                                              rel="noreferrer"
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 text-[9px] font-bold text-primary transition-all cursor-pointer"
                                                            >
                                                              {isYoutube ? <Video className="w-3 h-3 text-red-500" /> : <BookOpen className="w-3 h-3 text-blue-500" />}
                                                              <span>{link.title}</span>
                                                            </a>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Reference Guides and Coding Projects submission */}
                                        <div className="space-y-4">
                                          {week.resources && week.resources.length > 0 && (
                                            <div className="p-4 rounded-xl border border-border bg-card/15 space-y-3">
                                              <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5 text-accent" />
                                                <span>Study Guides</span>
                                              </span>
                                              <div className="space-y-2 text-xs font-semibold">
                                                {week.resources.map((resItem, rIdx) => (
                                                  <a
                                                    key={rIdx}
                                                    href={resItem.url.includes('youtube.com') ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resItem.title)}` : resItem.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-2.5 rounded border border-border/40 hover:bg-muted/40 transition-colors"
                                                  >
                                                    <span className="truncate pr-2">{resItem.title}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                                  </a>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Coding projects and submission */}
                                          {week.projects && week.projects.length > 0 && (
                                            <div className="p-4 rounded-xl border border-border bg-card/15 space-y-3">
                                              <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1">
                                                <Code className="w-3.5 h-3.5 text-green-500" />
                                                <span>Coding Projects</span>
                                              </span>
                                              <div className="space-y-2">
                                                {week.projects.map((proj, pIdx) => (
                                                  <div key={pIdx} className="space-y-2 p-3 rounded border border-border/40 bg-muted/5">
                                                    <div className="flex justify-between items-center">
                                                      <span className="font-bold text-xs">{proj.title}</span>
                                                      <button
                                                        onClick={() => setActiveProject(proj)}
                                                        className="text-[10px] text-primary hover:underline font-bold"
                                                      >
                                                        Details
                                                      </button>
                                                    </div>
                                                    
                                                    {/* Submit Project for AI code review */}
                                                    <button
                                                      onClick={() => setActiveSubmitProject(proj)}
                                                      className="w-full py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/25 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                                    >
                                                      <Send className="w-3 h-3" />
                                                      <span>Submit to AI Grader</span>
                                                    </button>
                                                  </div>
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
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE PATHWAY MINDMAP */}
          {activeTab === 'mindmap' && (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 rounded-2xl glass-card relative overflow-hidden"
            >
              <div className="mb-6">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  <span>Visual Path Map</span>
                </h3>
                <p className="text-xs text-muted-foreground">Click a month card or week pill to focus details and check off daily study steps.</p>
              </div>

              {/* Pathway Flow Layout */}
              <div className="flex flex-col gap-12 relative items-center py-6">
                
                {/* Flow lines in background */}
                <div className="absolute top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/30 via-accent/30 to-primary/30 z-0 hidden md:block" />

                {roadmap.timeline.map((month, mIdx) => (
                  <div key={month.monthNumber} className="w-full max-w-4xl relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
                    
                    {/* Month Node Card */}
                    <div className="w-full md:w-80 p-5 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur shadow-lg text-center md:text-left shrink-0">
                      <div className="inline-block px-2.5 py-0.5 rounded bg-primary/20 text-[10px] font-bold text-primary mb-2 uppercase">
                        Month {month.monthNumber}
                      </div>
                      <h4 className="font-extrabold text-base leading-tight text-foreground">{month.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-semibold">{month.description}</p>
                    </div>

                    {/* Weeks connected nodes */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {month.weeks.map((week) => {
                        const weekKey = `${month.monthNumber}-${week.weekNumber}`;
                        const isExpanded = !!expandedWeeks[weekKey];
                        
                        return (
                          <div 
                            key={week.weekNumber} 
                            onClick={() => {
                              toggleWeek(month.monthNumber, week.weekNumber);
                              if (!expandedMonths[month.monthNumber]) {
                                toggleMonth(month.monthNumber);
                              }
                              setActiveTab('timeline');
                              // Scroll into view
                              setTimeout(() => {
                                const el = document.getElementById(`week-header-${weekKey}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between hover:scale-105 active:scale-95 hover:shadow-md ${isExpanded ? 'border-primary/45 bg-card shadow-sm shadow-primary/5' : 'border-border/40 bg-muted/15'}`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Week {week.weekNumber}</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/50 animate-pulse" />
                              </div>
                              <h5 className="font-bold text-xs leading-tight text-foreground/95">{week.title}</h5>
                            </div>
                            <span className="text-[9px] text-primary font-bold mt-4 flex items-center gap-1">
                              <span>Go to timeline details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: RESOURCES EXPLORER HUB */}
          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Filter controls */}
              <div className="p-4 md:p-6 rounded-2xl glass-card flex flex-col md:flex-row gap-4 justify-between items-center">
                <input
                  type="text"
                  placeholder="Search resources by title or location..."
                  value={searchResource}
                  onChange={(e) => setSearchResource(e.target.value)}
                  className="w-full md:w-80 px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/20 rounded-xl overflow-x-auto w-full md:w-auto">
                  {(['all', 'youtube', 'docs', 'notes'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setResourceFilter(type)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize shrink-0 ${resourceFilter === type ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {type === 'all' ? 'All Guides' : type === 'youtube' ? 'Videos' : type === 'docs' ? 'Documentation' : 'Cheatsheets / Notes'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource cards Grid */}
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResources.map((resItem, rIdx) => {
                    const isYoutube = resItem.type === 'youtube' || resItem.url.includes('youtube.com') || resItem.url.includes('youtu.be');
                    return (
                      <a
                        key={rIdx}
                        href={isYoutube ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resItem.title)}` : resItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-xl border border-border/40 hover:border-border/80 bg-card/45 hover:bg-muted/15 transition-all flex justify-between items-center shadow-sm select-none"
                      >
                        <div className="min-w-0 pr-4 space-y-1">
                          <h4 className="font-bold text-xs truncate text-foreground">{resItem.title}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold">
                            <span className="px-1.5 py-0.5 bg-muted rounded uppercase">{resItem.type}</span>
                            <span>•</span>
                            <span>{resItem.origin}</span>
                          </div>
                        </div>

                        <div className="p-2 border border-border/40 rounded-lg shrink-0">
                          {isYoutube ? (
                            <Video className="w-4 h-4 text-red-500" />
                          ) : resItem.type === 'notes' ? (
                            <FileText className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 p-8 border border-dashed border-border/80 rounded-2xl bg-card/5">
                  <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <h4 className="font-bold text-sm">No resources match your search</h4>
                  <p className="text-xs text-muted-foreground mt-1">Try refining search parameters or filters.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* MODAL 1: WEEKLY MCQ AI QUIZ */}
        {activeQuizWeek && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="w-full max-w-lg bg-card rounded-2xl border border-border overflow-hidden shadow-2xl animate-scale-up">
              
              {/* Quiz Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
                <div>
                  <span className="text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    Week Assessment
                  </span>
                  <h3 className="text-sm font-bold mt-1 text-foreground">Quiz: {activeQuizWeek.title}</h3>
                </div>
                {!quizSubmitting && (
                  <button 
                    onClick={() => setActiveQuizWeek(null)} 
                    className="p-1.5 border border-border hover:bg-muted rounded-lg text-muted-foreground cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quiz Content */}
              <div className="p-6">
                {quizLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-bold">AI formulating technical MCQs...</span>
                  </div>
                ) : quizResults ? (
                  
                  // Quiz Results View
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="text-center p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                      <h4 className="font-extrabold text-lg text-foreground">Assessment Score: {quizResults.scorePercent}%</h4>
                      <p className="text-xs text-muted-foreground font-semibold">Earned +30 XP Points toward your career target!</p>
                    </div>

                    <div className="space-y-4">
                      {quizResults.questions.map((q, idx) => {
                        const correct = q.userAnswerIndex === q.correctAnswerIndex;
                        return (
                          <div key={idx} className="p-3.5 rounded-lg border border-border/40 space-y-2.5">
                            <p className="font-bold text-xs text-foreground/95">Q{idx + 1}: {q.questionText}</p>
                            
                            <div className="space-y-1.5 text-xs">
                              {q.options.map((opt: string, oIdx: number) => {
                                let bg = 'bg-muted/15 border-border/30';
                                if (oIdx === q.correctAnswerIndex) bg = 'bg-green-500/10 border-green-500/35 text-green-600 font-bold';
                                else if (oIdx === q.userAnswerIndex && !correct) bg = 'bg-red-500/10 border-red-500/35 text-red-600 font-bold';
                                
                                return (
                                  <div key={oIdx} className={`p-2 rounded border ${bg}`}>
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {q.explanation && (
                              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed bg-muted/10 p-2 rounded">
                                <span className="font-bold text-foreground/80">Explanation:</span> {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setActiveQuizWeek(null)}
                      className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Finish Assessment
                    </button>
                  </div>
                ) : quizQuestions.length > 0 ? (
                  
                  // Active Questions Step-by-Step View
                  <div className="space-y-5">
                    
                    {/* Progress indicators */}
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                      <span>Question {quizCurrentIndex + 1} of {quizQuestions.length}</span>
                      <span className="px-2 py-0.5 bg-muted rounded text-[10px]">{quizQuestions[quizCurrentIndex].topic}</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>

                    {/* Question text */}
                    <div className="p-4 rounded-xl border border-border/50 bg-muted/5">
                      <p className="font-extrabold text-xs text-foreground/90 leading-relaxed">
                        {quizQuestions[quizCurrentIndex].questionText}
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2">
                      {quizQuestions[quizCurrentIndex].options.map((opt: string, oIdx: number) => {
                        const isSelected = quizAnswers[quizCurrentIndex] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              const updated = [...quizAnswers];
                              updated[quizCurrentIndex] = oIdx;
                              setQuizAnswers(updated);
                            }}
                            className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border/40 hover:bg-muted/30 text-foreground/80'}`}
                          >
                            <span>{opt}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Nav controls */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setQuizCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={quizCurrentIndex === 0}
                        className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-lg disabled:opacity-40"
                      >
                        Back
                      </button>

                      {quizCurrentIndex === quizQuestions.length - 1 ? (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={quizSubmitting || quizAnswers[quizCurrentIndex] === undefined}
                          className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold text-xs rounded-lg shadow-lg disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {quizSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                          <span>Submit Assessment</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setQuizCurrentIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                          disabled={quizAnswers[quizCurrentIndex] === undefined}
                          className="px-5 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow disabled:opacity-40 transition-all"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Unable to load questions. Please check connection.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: AI SENIOR DEV PROJECT REVIEW SUBMISSION */}
        {activeSubmitProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="w-full max-w-lg bg-card rounded-2xl border border-border overflow-hidden shadow-2xl animate-scale-up">
              
              {/* Submit Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
                <div>
                  <span className="text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">
                    AI Code Reviewer
                  </span>
                  <h3 className="text-sm font-bold mt-1 text-foreground">Submit Project: {activeSubmitProject.title}</h3>
                </div>
                {!submittingProject && (
                  <button 
                    onClick={() => {
                      setActiveSubmitProject(null);
                      setProjectReviewResult(null);
                    }} 
                    className="p-1.5 border border-border hover:bg-muted rounded-lg text-muted-foreground cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Submit Content */}
              <div className="p-6">
                {submittingProject ? (
                  
                  // AI Review Loading Indicators
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                    <div className="space-y-1.5 animate-pulse text-xs font-bold text-muted-foreground">
                      <p>AI Senior Developer analyzing your project...</p>
                      <p className="text-[9px] font-semibold text-muted-foreground/60">Evaluating design patterns, CORS rules, and unit tests...</p>
                    </div>
                  </div>
                ) : projectReviewResult ? (
                  
                  // Code Review Dashboard Result
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 text-xs font-semibold">
                    <div className="text-center p-5 rounded-2xl bg-green-500/5 border border-green-500/10 space-y-2">
                      <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Overall Rating</h4>
                      <div className="text-3xl font-black text-green-600">{projectReviewResult.score} / 100</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">Earned +50 XP Points successfully!</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1 font-bold">Key Strengths</h4>
                        <ul className="space-y-1">
                          {projectReviewResult.strengths.map((str, idx) => (
                            <li key={idx} className="p-2 rounded bg-green-500/10 text-green-600 border border-green-500/15 flex items-start gap-2">
                              <span>✓</span>
                              <span className="font-semibold">{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1 font-bold">Areas for Improvement</h4>
                        <ul className="space-y-1">
                          {projectReviewResult.improvements.map((imp, idx) => (
                            <li key={idx} className="p-2 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/15 flex items-start gap-2">
                              <span>→</span>
                              <span className="font-semibold">{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1 font-bold">Senior Dev Verdict</h4>
                        <p className="text-muted-foreground bg-muted/10 p-2.5 rounded leading-relaxed font-semibold">{projectReviewResult.verdict}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSubmitProject(null);
                        setProjectReviewResult(null);
                      }}
                      className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Done Reviewing
                    </button>
                  </div>
                ) : (
                  
                  // Submit input form
                  <form onSubmit={handleSubmitProjectReview} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-muted-foreground mb-1.5 uppercase tracking-wider">GitHub Repository URL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/your-username/your-project"
                        value={projectRepoUrl}
                        onChange={(e) => setProjectRepoUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-muted-foreground mb-1.5 uppercase tracking-wider">Build Description (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Describe key design choices, challenges, or architectural components..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for AI Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSubmitProject(null)}
                        className="px-4 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

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
                        <span>Folder Structure</span>
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
                        <span>Deployment Guide</span>
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
