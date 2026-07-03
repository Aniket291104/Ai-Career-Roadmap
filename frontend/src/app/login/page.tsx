'use client';
import { GoogleLogin } from "@react-oauth/google";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useUserStore } from '@/store/user-store';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', data);

      if (res.data.status === 'verify_otp') {
        toast.info(res.data.message);
        const devOtpParam = res.data.devOtp ? `&devOtp=${res.data.devOtp}` : '';
        router.push(`/verify-otp?email=${encodeURIComponent(res.data.email)}${devOtpParam}`);
      } else {
        if (typeof window !== 'undefined') {
          if (res.data.accessToken) localStorage.setItem('accessToken', res.data.accessToken);
          if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        setUser(res.data.user);
        toast.success('Successfully logged in!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-mesh px-6 relative">
      {/* Background aurora */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative shadow-2xl">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <Logo className="w-9 h-9" />
            <span className="font-extrabold text-lg">Roadmap.AI</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-xs text-muted-foreground mt-1.5">Enter credentials to access your roadmap space</p>
        </div>

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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">Forgot?</Link>
            </div>
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="relative my-6 text-center text-xs">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/80" /></div>
          <span className="relative bg-background px-3 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Or continue with</span>
        </div>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              setSubmitting(true);

              const res = await api.post("/auth/google", {
                credential: credentialResponse.credential,
              });

              if (typeof window !== "undefined") {
                if (res.data.accessToken)
                  localStorage.setItem("accessToken", res.data.accessToken);

                if (res.data.refreshToken)
                  localStorage.setItem("refreshToken", res.data.refreshToken);
              }

              setUser(res.data.user);

              toast.success("Google Login Successful");

              router.push("/dashboard");
            } catch (error: any) {
              console.error(error);

              toast.error(
                error.response?.data?.message ||
                "Google Login Failed"
              );
            } finally {
              setSubmitting(false);
            }
          }}
          onError={() => {
            toast.error("Google Login Failed");
          }}
        />
        <p className="text-center text-xs mt-6 text-muted-foreground font-medium">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-bold">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
