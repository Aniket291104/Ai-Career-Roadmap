'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useUserStore } from '@/store/user-store';
import { Key, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

type OtpInput = z.infer<typeof otpSchema>;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast.error('Email parameter missing.');
      router.push('/login');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('Verification code re-sent to your email.');
      setCountdown(60); // 60s cooldown
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (data: OtpInput) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email,
        otp: data.otp,
      });
      if (typeof window !== 'undefined') {
        if (res.data.accessToken) localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      setUser(res.data.user);
      toast.success('Account verified successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP code.');
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
        <h2 className="text-2xl font-bold tracking-tight">Verify Your Email</h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          Enter the 6-digit OTP code dispatched to <span className="text-primary font-bold">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Verification Code</label>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              {...register('otp')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold tracking-[4px] text-center transition-all"
            />
          </div>
          {errors.otp && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.otp.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Account</span>}
        </button>
      </form>

      <div className="text-center text-xs mt-6 text-muted-foreground font-medium space-y-2">
        <p>
          Didn&apos;t receive the code?{' '}
          {countdown > 0 ? (
            <span className="text-primary font-bold">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-primary hover:underline font-bold focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </p>
        <p>
          Back to{' '}
          <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-mesh px-6 relative">
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <Suspense fallback={
        <div className="glass-card p-8 rounded-2xl text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
