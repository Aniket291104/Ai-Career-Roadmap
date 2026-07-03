'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Lock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation must match'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Token parameter is missing.');
      router.push('/login');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      toast.success(res.data.message);
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Token is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-2xl p-8 relative shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <Logo className="w-9 h-9" />
          <span className="font-extrabold text-lg">Roadmap.AI</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Set New Password</h2>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">Enter a fresh password below to reset credentials</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/60" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
            />
          </div>
          {errors.password && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/60" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
            />
          </div>
          {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-mesh px-6 relative">
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <Suspense fallback={
        <div className="glass-card p-8 rounded-2xl text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
