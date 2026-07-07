'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface PremiumUpgradeGateProps {
  featureName: string;
  featureDesc: string;
}

export function PremiumUpgradeGate({ featureName, featureDesc }: PremiumUpgradeGateProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/checkout', { tier: 'pro' });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment gateway initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border/40 bg-card/25 backdrop-blur-md relative overflow-hidden shadow-2xl space-y-6">
        {/* Background gradient decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/20 animate-pulse">
            <Lock className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {featureName} is Premium
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {featureDesc}
          </p>
        </div>

        <div className="p-4 bg-muted/30 border border-border/30 rounded-xl space-y-3 text-left relative z-10">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
            Unlocked in Premium Pro:
          </div>
          <ul className="space-y-2 text-xs font-semibold text-foreground/85">
            <li className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Unlimited Roadmaps & AI updates</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Detailed programming MCQ sessions</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Unlimited ATS resume reviews</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Live mock coding & HR interview bots</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 relative z-10 pt-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Upgrade to Premium Pro ($19/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="text-[10px] text-muted-foreground">
            Stripe Mock Sandbox Mode Enabled — Instant simulator upgrade
          </div>
        </div>
      </div>
    </div>
  );
}
