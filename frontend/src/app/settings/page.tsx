'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { api } from '@/lib/api';
import { useUserStore } from '@/store/user-store';
import { toast } from 'sonner';
import { triggerRazorpayCheckout } from '@/lib/razorpay';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  User as UserIcon, 
  GraduationCap, 
  Link2, 
  BookOpen, 
  Loader2, 
  Sun, 
  Moon,
  Save,
  LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
  graduationYear: z.coerce.number().optional(),
  experience: z.coerce.number().optional(),
  skills: z.string().optional(),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  leetcodeUsername: z.string().optional(),
  codeforcesUsername: z.string().optional(),
  learningStyle: z.enum(['visual', 'practical', 'theoretical', 'mixed']).default('mixed'),
  dailyStudyHours: z.coerce.number().min(1).max(24).default(2),
  preferredLanguage: z.string().default('English'),
});

type SettingsInput = z.infer<typeof updateProfileSchema>;

export default function SettingsPage() {
  const { user, setUser, logout } = useUserStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(updateProfileSchema) as any,
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('phone', (user as any).phone || '');
      setValue('college', (user as any).college || '');
      setValue('university', (user as any).university || '');
      setValue('degree', (user as any).degree || '');
      setValue('graduationYear', (user as any).graduationYear || 2026);
      setValue('experience', (user as any).experience || 0);
      setValue('skills', user.skills ? user.skills.join(', ') : '');
      setValue('github', (user as any).github || '');
      setValue('linkedin', (user as any).linkedin || '');
      setValue('portfolioUrl', (user as any).portfolioUrl || '');
      setValue('leetcodeUsername', (user as any).leetcodeUsername || '');
      setValue('codeforcesUsername', (user as any).codeforcesUsername || '');
      setValue('learningStyle', (user as any).learningStyle || 'mixed');
      setValue('dailyStudyHours', (user as any).dailyStudyHours || 2);
      setValue('preferredLanguage', (user as any).preferredLanguage || 'English');
    }
  }, [user, setValue]);

  const onSubmit = async (data: SettingsInput) => {
    setSubmitting(true);
    // Parse skills list
    const skillsArray = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    try {
      const res = await api.put('/auth/profile', {
        ...data,
        skills: skillsArray,
      });
      setUser(res.data.user);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscriptionUpgrade = async (tier: 'pro' | 'premium') => {
    try {
      await triggerRazorpayCheckout({
        tier,
        onSuccess: async (response) => {
          toast.success(`Subscription upgraded to ${tier} successfully!`);
          try {
            const meRes = await api.get('/auth/me');
            setUser(meRes.data.user);
          } catch (meErr) {
            console.error('Failed to reload profile:', meErr);
          }
        },
        onFailure: (err) => {
          toast.error(err?.description || err?.message || 'Payment failed.');
        }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Payment gateway initialization failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      logout();
      toast.success('Successfully logged out.');
      router.push('/login');
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      logout();
      toast.success('Logged out.');
      router.push('/login');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* THEME SELECTOR CARD */}
          <div className="p-6 rounded-2xl glass-card flex justify-between items-center bg-card/25">
            <div>
              <h4 className="font-bold text-sm">Visual Mode Preferences</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Toggle light/dark screen palette options</p>
            </div>

            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-3 border border-border bg-background rounded-lg hover:bg-muted/40 transition-colors flex items-center gap-2 text-xs font-bold"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-primary" />
                  <span>Switch to Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span>Switch to Light</span>
                </>
              )}
            </button>
          </div>

          {/* SUBSCRIPTION PLAN WIDGET */}
          <div className="p-6 rounded-2xl glass-card grid md:grid-cols-3 gap-6 bg-card/25 items-center">
            <div className="md:col-span-2">
              <h4 className="font-bold text-sm">Subscription & Membership Settings</h4>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">
                Current Level: <span className="text-primary font-extrabold">{(user as any)?.subscriptionTier || 'Free'}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 max-w-md font-semibold leading-relaxed">
                Unlock daily adaptive roadmap adjustments, detailed ATS resume improvements checklist downloads, and live mentor mock interview review slots.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!((user as any)?.subscriptionTier) || (user as any).subscriptionTier === 'free' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubscriptionUpgrade('pro')}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-xs font-bold shadow hover:opacity-95 transition-all cursor-pointer"
                  >
                    Upgrade to Pro ($1.1/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubscriptionUpgrade('premium')}
                    className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-bold shadow hover:opacity-95 transition-all cursor-pointer"
                  >
                    Upgrade to Premium ($49/mo)
                  </button>
                </>
              ) : null}

              {(user as any)?.subscriptionTier === 'pro' && (
                <button
                  type="button"
                  onClick={() => handleSubscriptionUpgrade('premium')}
                  className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-bold shadow hover:opacity-95 transition-all cursor-pointer"
                >
                  Upgrade to Premium ($49/mo)
                </button>
              )}

              {(user as any)?.subscriptionTier && (user as any).subscriptionTier !== 'free' && (
                <div className="p-2.5 border border-green-500/20 bg-green-500/10 text-green-500 text-center rounded-lg text-[10px] font-bold">
                  Active Subscription ✅
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* PERSONAL METADATA */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-2.5">
                <UserIcon className="w-5 h-5 text-primary" />
                <span>Personal Info</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1">{(errors.name.message as any)}</p>}
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Study Skills Inventory</label>
                  <input
                    type="text"
                    placeholder="e.g. HTML, React, Python"
                    {...register('skills')}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Separate keywords with commas</p>
                </div>
              </div>
            </div>

            {/* COLLEGE & EXPERIENCE */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-2.5">
                <GraduationCap className="w-5 h-5 text-accent" />
                <span>Education & Career</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">College</label>
                    <input
                      type="text"
                      {...register('college')}
                      className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">University</label>
                    <input
                      type="text"
                      {...register('university')}
                      className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Degree Title</label>
                    <input
                      type="text"
                      placeholder="B.S. Computer Science"
                      {...register('degree')}
                      className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Grad Year</label>
                    <input
                      type="number"
                      {...register('graduationYear')}
                      className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Years of Experience</label>
                  <input
                    type="number"
                    {...register('experience')}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* PREFERENCES */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-2.5">
                <BookOpen className="w-5 h-5 text-green-500" />
                <span>Learning Setup</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Daily Study Hours</label>
                  <input
                    type="number"
                    {...register('dailyStudyHours')}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Style focus</label>
                  <select
                    {...register('learningStyle')}
                    className="w-full px-2 py-2.5 border border-border bg-background rounded-lg text-muted-foreground font-semibold"
                  >
                    <option value="mixed">Mixed (Standard)</option>
                    <option value="practical">Practical hands-on</option>
                    <option value="visual">Visual tutorials</option>
                    <option value="theoretical">Documentation/Books</option>
                  </select>
                </div>
              </div>
            </div>

            {/* WEB LINKS */}
            <div className="p-6 rounded-2xl glass-card space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-2.5">
                <Link2 className="w-5 h-5 text-primary" />
                <span>Social Links</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    {...register('github')}
                    className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                  />
                  {errors.github && <p className="text-[10px] text-red-500 mt-1">{(errors.github.message as any)}</p>}
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                  <input
                    type="url"
                    {...register('linkedin')}
                    className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                  />
                  {errors.linkedin && <p className="text-[10px] text-red-500 mt-1">{(errors.linkedin.message as any)}</p>}
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">LeetCode Username</label>
                  <input
                    type="text"
                    placeholder="e.g. lc_user"
                    {...register('leetcodeUsername')}
                    className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Codeforces Username</label>
                  <input
                    type="text"
                    placeholder="e.g. cf_user"
                    {...register('codeforcesUsername')}
                    className="w-full px-3 py-2.5 border border-border bg-background rounded-lg font-semibold"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Submit save */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary text-white font-bold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving details...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* SIGN OUT SECTION */}
        <div className="p-6 rounded-2xl glass-card flex justify-between items-center bg-card/25 border border-red-500/10 mt-6">
          <div>
            <h4 className="font-bold text-sm text-red-500">Sign Out</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">Terminate your session and log out of this device</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
