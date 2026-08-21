'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Map, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Clock, 
  Compass, 
  ArrowRight,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/user-store';

const generateRoadmapSchema = z.object({
  skills: z.string().min(2, 'Please list at least one skill (e.g. JavaScript, HTML)'),
  goal: z.string().min(2, 'Please select or describe your target career goal'),
  dailyStudyHours: z.number().min(1).max(24),
  learningStyle: z.enum(['visual', 'practical', 'theoretical', 'mixed']),
  preferredLanguage: z.string(),
  targetDuration: z.number().min(1).max(12),
});

type GenerateInput = z.infer<typeof generateRoadmapSchema>;

interface RoadmapItem {
  _id: string;
  title: string;
  targetRole: string;
  difficulty: string;
  estimatedDuration: string;
  progressPercent: number;
  skillsCovered: string[];
  createdAt: string;
}

export default function RoadmapsPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const isLimitReached = (!user || !user.subscriptionTier || user.subscriptionTier === 'free') && roadmaps.length >= 2;

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roadmaps');
      setRoadmaps(res.data.roadmaps);
    } catch (err) {
      toast.error('Failed to load roadmaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateInput>({
    resolver: zodResolver(generateRoadmapSchema),
    defaultValues: {
      dailyStudyHours: 2,
      learningStyle: 'mixed',
      preferredLanguage: 'English',
      targetDuration: 3,
    }
  });

  const onSubmit = async (data: GenerateInput) => {
    setGenerating(true);
    // Split comma-separated skills string into array, trim whitespace, filter empty
    const skillsArray = data.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      toast.error('Please enter at least one skill.');
      setGenerating(false);
      return;
    }

    try {
      const res = await api.post('/roadmaps/generate', {
        ...data,
        skills: skillsArray,
      });
      toast.success('Your personalized AI career roadmap has been synthesized!');
      reset();
      setShowForm(false);
      
      // Route immediately to new roadmap detailed timeline view
      router.push(`/roadmaps/${res.data.roadmap._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Roadmap generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this roadmap?')) return;

    try {
      await api.delete(`/roadmaps/${id}`);
      toast.success('Roadmap deleted.');
      fetchRoadmaps();
    } catch (err) {
      toast.error('Failed to delete roadmap.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Career Roadmaps</h2>
            <p className="text-xs text-muted-foreground font-semibold">Track and manage your generated career steps</p>
          </div>
          
          <div className="flex items-center gap-3">
            {(!user || !user.subscriptionTier || user.subscriptionTier === 'free') ? (
              <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-600 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>Free Plan: {roadmaps.length} / 2 roadmaps</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-600 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-green-500" />
                <span className="capitalize">{user.subscriptionTier} Plan: Unlimited</span>
              </div>
            )}

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow hover:bg-primary/95 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Generate Roadmap</span>
              </button>
            )}
          </div>
        </div>

        {/* GENERATOR WIZARD FORM */}
        {showForm && (
          <div className="p-6 md:p-8 rounded-2xl glass-card relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
            {isLimitReached ? (
              <div className="text-center py-8 max-w-lg mx-auto space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Upgrade to Pro/Premium Tier</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You have generated <span className="font-extrabold text-foreground">{roadmaps.length} / 2 roadmaps</span> allowed on the Free Plan. Upgrade to a paid plan to unlock unlimited roadmap generations, personalized AI modules, priority support, and daily learning analytics!
                </p>
                <div className="flex justify-center gap-3 pt-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold text-sm rounded-lg shadow-lg active:scale-95 transition-all"
                  >
                    Explore Paid Plans
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border border-border hover:bg-muted/40 font-semibold text-sm rounded-lg active:scale-95 transition-all text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-primary animate-spin-slow" />
                  <span>AI Career Advisor Setup</span>
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Your Current Skills</label>
                      <input
                        type="text"
                        placeholder="e.g. JavaScript, HTML, Python, basic databases"
                        {...register('skills')}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Separate skills with commas</p>
                      {errors.skills && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.skills.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Target Career Goal</label>
                      <select
                        {...register('goal')}
                        className="w-full px-3 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-muted-foreground transition-all"
                      >
                        <option value="">Select target career</option>
                        <option value="Frontend Developer">Frontend Web Developer</option>
                        <option value="Backend Developer">Backend Web Developer</option>
                        <option value="Full Stack Developer">Full Stack Software Engineer</option>
                        <option value="AI Engineer">AI Engineer</option>
                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                        <option value="DevOps Engineer">DevOps & Cloud Engineer</option>
                        <option value="Cyber Security Engineer">Cyber Security Analyst</option>
                      </select>
                      {errors.goal && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.goal.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Daily Study Hours</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        {...register('dailyStudyHours', { valueAsNumber: true })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all"
                      />
                      {errors.dailyStudyHours && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.dailyStudyHours.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Target Duration</label>
                      <select
                        {...register('targetDuration', { valueAsNumber: true })}
                        className="w-full px-3 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-muted-foreground transition-all"
                      >
                        <option value={1}>1 Month (Crash Course)</option>
                        <option value={2}>2 Months (Fast Track)</option>
                        <option value={3}>3 Months (Standard)</option>
                        <option value={6}>6 Months (Deep Dive)</option>
                        <option value={12}>12 Months (Comprehensive)</option>
                      </select>
                      {errors.targetDuration && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.targetDuration.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Learning Style</label>
                      <select
                        {...register('learningStyle')}
                        className="w-full px-3 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-muted-foreground transition-all"
                      >
                        <option value="mixed">Mixed style (Standard)</option>
                        <option value="practical">Practical hands-on projects</option>
                        <option value="visual">Visual diagrams and video tutorials</option>
                        <option value="theoretical">Theoretical documentation/books</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Output Language</label>
                      <input
                        type="text"
                        {...register('preferredLanguage')}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Synthesizing roadmap...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Timeline</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-3 border border-border hover:bg-muted/40 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ROADMAPS LISTINGS */}
        {loading ? (
          <div className="h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmaps.map((mapItem) => (
              <Link 
                key={mapItem._id}
                href={`/roadmaps/${mapItem._id}`}
                className="block p-6 rounded-2xl glass-card border border-border/30 hover:border-border/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-lg leading-tight hover:text-primary transition-colors">{mapItem.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Goal: {mapItem.targetRole}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(mapItem._id, e)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      aria-label="Delete roadmap"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{mapItem.estimatedDuration}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded text-[10px] uppercase font-bold text-foreground/80">{mapItem.difficulty}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/20 bg-muted/5 mb-6">
                    <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Key Targets</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {mapItem.skillsCovered.slice(0, 4).map((sk, i) => (
                        <span key={i} className="px-2 py-0.5 bg-muted/60 text-foreground/75 text-[10px] rounded border border-border/20">
                          {sk}
                        </span>
                      ))}
                      {mapItem.skillsCovered.length > 4 && (
                        <span className="text-[10px] text-muted-foreground font-bold self-center">+{mapItem.skillsCovered.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Progress</span>
                    <span>{mapItem.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${mapItem.progressPercent}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card/10 space-y-4">
            <Compass className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <h3 className="font-bold text-lg">No Roadmaps Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You haven&apos;t generated any career roadmaps yet. Use our AI setup assistant to get started.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow hover:bg-primary/95 transition-all flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Create Your First Roadmap</span>
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
