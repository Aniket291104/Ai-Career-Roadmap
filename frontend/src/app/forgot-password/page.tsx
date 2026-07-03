'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Mail, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotInput) => {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', data);
      toast.success('Reset link dispatched if the account exists.');
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-mesh px-6 relative">
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <Logo className="w-9 h-9" />
            <span className="font-extrabold text-lg">Roadmap.AI</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Recover Password</h2>
          <p className="text-xs text-muted-foreground mt-1.5">Enter email to request reset link</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 text-sm rounded-lg text-primary font-semibold">
              If an account with that email exists, we have dispatched a password reset link. Please check your inbox.
            </div>
            <Link href="/login" className="block w-full py-3 bg-secondary text-center text-sm font-semibold rounded-lg hover:bg-secondary/85 transition-all">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
