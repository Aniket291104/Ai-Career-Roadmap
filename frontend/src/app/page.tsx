'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/logo';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme as useNextTheme } from 'next-themes';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Compass, 
  Map, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Cpu, 
  Layout, 
  Flame, 
  ArrowRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Mail, 
  Terminal, 
  ChevronDown,
  Loader2 
} from 'lucide-react';

export default function LandingPage() {
  const { theme, setTheme } = useNextTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribingNewsletter, setSubscribingNewsletter] = useState(false);

  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submittingContact, setSubmittingContact] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const activePathRef = useRef<SVGPathElement | null>(null);
  const roverRef = useRef<SVGGElement | null>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: mockupRef,
    offset: ["start end", "center center"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);


  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribingNewsletter(true);
    try {
      const res = await api.post('/newsletter/subscribe', { email: newsletterEmail });
      toast.success(res.data.message);
      setNewsletterEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to subscribe to newsletter.');
    } finally {
      setSubscribingNewsletter(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.warning('Please fill in all fields.');
      return;
    }
    setSubmittingContact(true);
    try {
      const res = await api.post('/contact/message', contactForm);
      toast.success(res.data.message);
      setContactForm({ name: '', email: '', message: '' });
      setContactModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const processSteps = [
    {
      num: '01',
      title: 'Profile Analysis',
      desc: 'Define your starting tech stack, career target, and daily hours to establish a customized baseline.',
    },
    {
      num: '02',
      title: 'Synthesize Roadmap',
      desc: 'Generate custom monthly milestones, weekly goals, and daily tasks for active learning.',
    },
    {
      num: '03',
      title: 'Skill Assessments',
      desc: 'Evaluate your understanding with dynamic coding sandboxes and conceptual quizzes.',
    },
    {
      num: '04',
      title: 'Resume Diagnostic',
      desc: 'Scan formatting and key terms against targeted roles to maximize your ATS pass rate.',
    },
    {
      num: '05',
      title: 'Mock Interviews',
      desc: 'Simulate full technical or behavioral interview loops with dedicated AI agents.',
    },
    {
      num: '06',
      title: 'Job Ready',
      desc: 'Unlock verification credentials and showcase your roadmap execution to partner companies.',
    }
  ];

  const features = [
    { title: 'AI Roadmap Generator', desc: 'Generate multi-month structures with weekly milestones, daily subtasks, coding practices, and curated resources.', icon: Map },
    { title: 'Interactive Assessments', desc: 'Evaluate your technical skills using dynamic programming MCQs and logical quizzes to isolate weaker areas.', icon: Sparkles },
    { title: 'ATS Resume Review', desc: 'Scan and review resume keywords against specific job targets, returning ATS scores and format improvements.', icon: UserCheck },
    { title: 'Mock Technical Interviews', desc: 'Simulate technical or behavioral interview loops with structured question trees and performance ratings.', icon: Cpu },
    { title: 'XP & Streak Tracker', desc: 'Maintain learning consistency with daily streaks, activity heatmaps, and experience points rewards.', icon: Flame },
    { title: 'Integrated Sandbox', desc: 'Write and compile solutions directly within a secure, browser-isolated coding execution runtime.', icon: Layout }
  ];

  const categories = [
    { title: 'AI & Machine Learning', icon: Cpu, desc: 'Generative AI, Deep Learning architectures, model optimization, PyTorch, HuggingFace.' },
    { title: 'Full Stack Development', icon: Layout, desc: 'Next.js, React 19, TypeScript, Express, Mongoose, PostgreSQL, state machines.' },
    { title: 'Cloud & DevOps Engineering', icon: CloudIcon, desc: 'AWS scaling, Docker containers, Kubernetes, GitHub Actions, Terraform configurations.' },
    { title: 'Cyber Security', icon: ShieldCheck, desc: 'Penetration testing, encryption systems, network forensics, API token security.' },
    { title: 'Blockchain & Web3', icon: Terminal, desc: 'Solidity contracts, decentralized apps, Ethereum, Ethers.js, consensus algorithms.' },
    { title: 'UI/UX & Product Design', icon: Compass, desc: 'Apple design system guidelines, glassmorphic interfaces, Figma flows, interactions.' },
  ];

  const faqList = [
    { q: 'How does the AI Roadmap Generator create recommendations?', a: 'Our system analyzes your starting tech stack, career targets, learning style, and daily hours. It uses generative models to synthesize a logical, step-by-step learning progression, complete with curated references and coding assignments.' },
    { q: 'Can I track my progress and maintain streaks?', a: 'Yes! Every time you mark a daily roadmap task completed, you gain XP points, update your activity calendar heatmap, and increment your active learning streak count.' },
    { q: 'Is there a limit to how many roadmaps I can generate?', a: 'Free accounts can generate up to 2 active roadmaps. Premium subscribers get unlimited roadmap generations, custom resume analyses, and access to all mock interview sessions.' },
    { q: 'Can I export my data or get a certificate?', a: 'Upon completing 100% of a generated roadmap, you unlock a verification certificate featuring a unique credential ID suitable for LinkedIn and CV sharing.' }
  ];

  useEffect(() => {
    const container = containerRef.current;
    const activePath = activePathRef.current;
    const rover = roverRef.current;
    
    if (!container || !activePath) return;

    let animationFrameId: number;
    let targetScrollT = 0;
    let currentT = 0;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMediaChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll progress relative to the timeline container's position in the viewport.
      // Starts when the top of the container enters 75% of the viewport.
      // Ends when the bottom of the container passes 25% of the viewport.
      const startTrigger = viewportHeight * 0.75;
      const endTrigger = viewportHeight * 0.25;
      
      const totalRange = containerRect.height + startTrigger - endTrigger;
      const progress = startTrigger - containerRect.top;
      
      const rawT = progress / totalRange;
      targetScrollT = Math.max(0, Math.min(1, rawT));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const updatePath = () => {
      const containerRect = container.getBoundingClientRect();
      const points = dotsRef.current
        .filter(Boolean)
        .map((dot) => {
          const rect = dot!.getBoundingClientRect();
          return {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
          };
        });

      if (points.length < 2) return;

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dy = p1.y - p0.y;
        
        const cp1x = p0.x;
        const cp1y = p0.y + dy * 0.45;
        const cp2x = p1.x;
        const cp2y = p1.y - dy * 0.45;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }

      const bgPath = document.getElementById('bg-trail-path') as SVGPathElement | null;
      const fgPath = document.getElementById('fg-trail-path') as SVGPathElement | null;

      if (bgPath) bgPath.setAttribute('d', d);
      if (fgPath) {
        fgPath.setAttribute('d', d);
        const len = fgPath.getTotalLength();
        fgPath.style.strokeDasharray = `${len}`;
        fgPath.style.strokeDashoffset = `${len}`;
      }

      // Recalculate target scroll progress on path resize
      handleScroll();
    };

    updatePath();
    window.addEventListener('resize', updatePath);

    const timer1 = setTimeout(updatePath, 150);
    const timer2 = setTimeout(updatePath, 600);

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(updatePath);
    }

    const tick = () => {
      const fgPath = document.getElementById('fg-trail-path') as SVGPathElement | null;
      if (!fgPath) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const len = fgPath.getTotalLength();

      if (prefersReducedMotion) {
        // Reduced motion: snap directly to the target scroll position with no smoothing
        currentT = targetScrollT;
        const pt = fgPath.getPointAtLength(currentT * len);
        
        if (rover) {
          rover.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        }
        
        fgPath.style.strokeDashoffset = `${len * (1 - currentT)}`;
        
        const containerRect = container.getBoundingClientRect();
        const points = dotsRef.current
          .filter(Boolean)
          .map((dot) => {
            const rect = dot!.getBoundingClientRect();
            return {
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height / 2
            };
          });

        dotsRef.current.forEach((dot, idx) => {
          const card = dot?.closest('.milestone-card-container') as HTMLDivElement | null;
          if (!card || !points[idx]) return;
          const dist = Math.hypot(pt.x - points[idx].x, pt.y - points[idx].y);
          const intensity = Math.max(0, 1 - dist / 220);
          card.style.setProperty('--active-intensity', intensity.toFixed(3));
        });

        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Elastic scroll drift using linear interpolation (lerp)
      currentT += (targetScrollT - currentT) * 0.075;
      if (Math.abs(targetScrollT - currentT) < 0.0001) {
        currentT = targetScrollT;
      }

      const t = currentT;
      const pt = fgPath.getPointAtLength(t * len);

      if (rover) {
        rover.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      }

      fgPath.style.strokeDashoffset = `${len * (1 - t)}`;

      const r = Math.round(255 + (63 - 255) * t);
      const g = Math.round(180 + (224 - 180) * t);
      const b = Math.round(84 + (201 - 84) * t);
      const roverColor = `rgb(${r}, ${g}, ${b})`;

      const roverGlow = document.getElementById('rover-glow-circle');
      const roverCore = document.getElementById('rover-core-circle');
      if (roverGlow) roverGlow.setAttribute('fill', roverColor);
      if (roverCore) roverCore.setAttribute('fill', roverColor);

      const containerRect = container.getBoundingClientRect();
      const points = dotsRef.current
        .filter(Boolean)
        .map((dot) => {
          const rect = dot!.getBoundingClientRect();
          return {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
          };
        });

      dotsRef.current.forEach((dot, idx) => {
        const card = dot?.closest('.milestone-card-container') as HTMLDivElement | null;
        if (!card || !points[idx]) return;
        const dist = Math.hypot(pt.x - points[idx].x, pt.y - points[idx].y);
        const intensity = Math.max(0, 1 - dist / 220);
        card.style.setProperty('--active-intensity', intensity.toFixed(3));
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updatePath);
      mediaQuery.removeEventListener('change', handleMediaChange);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen font-sans bg-background text-foreground transition-colors duration-300 relative bg-grid-mesh">
      
      {/* Aurora Ambient Lighting (Aesthetic background glow) */}
      <div className="absolute top-[-100px] left-1/4 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] right-1/4 w-[700px] h-[700px] bg-secondary/3 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-10 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <a href="#process" className="hover:text-foreground transition-colors">Winding Trail</a>
            <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#categories" className="hover:text-foreground transition-colors">Tracks</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQs</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link href="/login" className="text-xs font-mono uppercase tracking-wider hover:text-foreground transition-colors text-muted-foreground">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2 text-xs font-mono uppercase tracking-wider text-background bg-primary hover:bg-primary/90 rounded transition-all active:scale-95 font-bold shadow-md shadow-primary/10"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={toggleTheme} className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded-full border border-border hover:bg-muted text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 p-6 bg-background border-b border-border md:hidden flex flex-col gap-4 text-center font-mono uppercase text-xs tracking-wider"
          >
            <a href="#process" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Winding Trail</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Capabilities</a>
            <a href="#categories" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Tracks</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">FAQs</a>
            <hr className="border-border" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link 
              href="/register" 
              onClick={() => setMobileMenuOpen(false)} 
              className="py-3 bg-primary text-background rounded font-bold"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 md:pt-32 pb-24 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-[10px] font-mono uppercase tracking-widest text-primary">
            <Sparkles className="w-3 h-3" />
            <span>AI Career Training Pipeline v1.2</span>
          </div>

          <h1 className="max-w-5xl font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight text-foreground">
            Tech Careers are not born.<br />
            They are <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">trained.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            A comprehensive, automated training simulator designing personalized roadmap trails, real-time code executions, resume diagnostic loops, and AI mock evaluations.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm">
            <Link 
              href="/register" 
              className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-background bg-primary hover:bg-primary/95 rounded transition-all flex items-center justify-center gap-2 group active:scale-95 font-bold shadow-md shadow-primary/10"
            >
              <span>Explore Roadmaps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider border border-border hover:bg-card rounded transition-colors flex items-center justify-center font-bold text-foreground"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* HERO SHOWCASE CARD (Mockup Screen with Scroll-linked Minimize to Maximize animation) */}
        <motion.div
          ref={mockupRef}
          style={{ scale, opacity, y }}
          className="mt-16 md:mt-24 max-w-4xl mx-auto rounded-lg overflow-hidden border border-border bg-card shadow-2xl relative"
        >
          {/* Windows title bar mockup */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 font-mono text-[10px] text-muted-foreground">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ef4444]/60" />
              <div className="w-2 h-2 rounded-full bg-[#ffb454]/60" />
              <div className="w-2 h-2 rounded-full bg-[#3fe0c9]/60" />
            </div>
            <span>active_timeline_session.sh</span>
            <div className="w-8" />
          </div>

          <div className="bg-background/45 p-6 md:p-8 grid md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2 space-y-5">
              <h3 className="text-base font-bold font-display flex items-center gap-2 text-foreground">
                <Map className="w-4 h-4 text-primary" />
                <span>AI Engineering Training Roadmap</span>
                <span className="px-2 py-0.5 text-[9px] font-mono border border-primary/25 rounded bg-primary/5 text-primary">Active</span>
              </h3>
              
              <div className="p-4 rounded border border-border bg-card/45 space-y-3 font-sans">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Module 1: Transformers & LLM Architectures</span>
                  <span className="text-secondary font-bold">45% Complete</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded border border-border bg-card/25 font-sans">
                  <Flame className="w-4 h-4 text-primary animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Daily Activity Streak</h4>
                    <p className="text-[10px] text-muted-foreground">Pipeline compilation successful. Streak: 12 days (+15 XP)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 font-mono text-[10px]">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pb-1 font-mono">Evaluations</h4>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between mb-1.5 text-muted-foreground">
                    <span>Python Runtime</span>
                    <span className="text-foreground">90%</span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-1">
                    <div className="bg-secondary h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-muted-foreground">
                    <span>Model Fine-tuning</span>
                    <span className="text-foreground">55%</span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-muted-foreground">
                    <span>RLHF Pipeline</span>
                    <span className="text-foreground">30%</span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-1">
                    <div className="bg-primary/45 h-full rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PROCESS TIMELINE SECTION (Trail Map Concept) */}
      <section id="process" className="py-24 border-t border-border overflow-visible">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Map Timeline</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-foreground">
            The Interactive Career Trail
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-xs md:text-sm leading-relaxed">
            Follow the winding trail map to see how the system coordinates profile feedback, real-time exercises, mock evaluations, and job-ready status. Watch the glowing marker travel the route.
          </p>
        </div>

        {/* Outer container of the responsive timeline path */}
        <div 
          ref={containerRef} 
          className="relative w-full max-w-4xl mx-auto py-16 px-6 md:px-12 overflow-visible"
        >
          {/* SVG path system overlaying the elements */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
            style={{ minHeight: '100%' }}
          >
            <defs>
              <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffb454" />
                <stop offset="100%" stopColor="#3fe0c9" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Background path track */}
            <path 
              id="bg-trail-path" 
              stroke="#162028" 
              strokeWidth={3} 
              strokeLinecap="round"
              fill="none" 
            />
            
            {/* Active (glowing) path track */}
            <path 
              id="fg-trail-path" 
              stroke="url(#trail-gradient)" 
              strokeWidth={3.5} 
              strokeLinecap="round"
              fill="none" 
              ref={activePathRef}
            />
            
            {/* Active glowing rover element */}
            <g id="rover-group" ref={roverRef}>
              <circle id="rover-glow-circle" r={10} fill="#ffb454" filter="url(#glow)" opacity={0.8} />
              <circle id="rover-core-circle" r={3.5} fill="#ffffff" />
            </g>
          </svg>

          {/* Milestone Cards list */}
          <div className="relative z-10 flex flex-col gap-12 md:gap-24 pl-8 md:pl-0">
            {processSteps.map((step, idx) => (
              <div 
                key={idx}
                className={`w-full md:w-[45%] flex flex-col relative group milestone-card-container ${
                  idx % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'
                }`}
                style={{ '--active-intensity': 0 } as any}
              >
                {/* Dot Anchor centered inside the card on desktop, on the left rail on mobile */}
                <div 
                  ref={el => { dotsRef.current[idx] = el }}
                  className="absolute w-3 h-3 rounded-full bg-background border-2 border-primary z-30 transition-all duration-300
                             md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                             left-[-22px] top-[28px]"
                />
                
                {/* Interactive Card Body */}
                <div className="milestone-card p-6 md:p-8 rounded border bg-card/75 backdrop-blur-md relative overflow-hidden">
                  {/* Step label styling */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-semibold">
                      Milestone {idx + 1}
                    </span>
                    <span className="font-mono text-xl font-bold milestone-step-num">
                      {step.num}
                    </span>
                  </div>
                  
                  {/* Display title and description */}
                  <h3 className="font-display font-bold text-base milestone-card-title mb-2">
                    {step.title}
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">System Architecture</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-foreground">
            Platform Capabilities
          </h2>
          <p className="mt-4 text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            Everything you need to successfully transition careers or master new technical domains in one secure runtime environment.
          </p>
        </div>

        {/* 6 cards, 3 columns with hairline dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-8 border-r border-b border-border bg-card/30 flex flex-col justify-between hover:bg-card/65 transition-all duration-300 group"
              >
                <div>
                  <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center text-primary mb-8 group-hover:border-primary/45 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-3">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CURATED TRACKS SECTION */}
      <section id="categories" className="py-24 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Pre-configured Paths</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-foreground">
            Explore Curated Careers
          </h2>
          <p className="mt-4 text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            Generate customized, weekly roadmap tracks across high-demand engineering categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-8 rounded border border-border bg-card/25 hover:bg-card/75 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between min-h-[220px] group">
                <div>
                  <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center text-secondary mb-6 group-hover:border-secondary/40 transition-colors">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-3">{cat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Scaling Licenses</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-foreground">
            Transparent Scaling Plans
          </h2>
          <p className="mt-4 text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto">
            Choose the membership that matches your speed of professional timeline execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded border border-border bg-card/45 flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Standard</span>
              <h3 className="text-xl font-display font-bold mt-2 text-foreground">Free Plan</h3>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed font-sans">
                Perfect for developers beginning to organize baseline career milestones.
              </p>
              <div className="my-8 text-3xl font-display font-bold text-foreground">
                $0 <span className="font-mono text-[10px] text-muted-foreground">/ forever</span>
              </div>
              <ul className="space-y-4 text-xs">
                <li className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span>2 Active Roadmap Trails</span>
                </li>
                <li className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span>Standard skill quiz evaluations</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground/35">
                  <X className="w-3.5 h-3.5" />
                  <span>Custom resume diagnostics</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground/35">
                  <X className="w-3.5 h-3.5" />
                  <span>AI mock interviewer access</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/register" 
              className="mt-8 py-3 text-center text-xs font-mono uppercase tracking-wider border border-border hover:bg-card rounded transition-colors text-foreground font-bold"
            >
              Get Started Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded border border-primary bg-card/65 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-primary/5">
            {/* Pop badge */}
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary text-background text-[9px] font-mono uppercase tracking-widest font-extrabold rounded-bl">
              Popular
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-semibold">Accelerate</span>
              <h3 className="text-xl font-display font-bold mt-2 text-foreground">Premium Pro</h3>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed font-sans">
                Designed for engineers preparing to clear specialized technical interview loops.
              </p>
              <div className="my-8 text-3xl font-display font-bold text-foreground">
                $1.1 <span className="font-mono text-[10px] text-muted-foreground">/ month</span>
              </div>
              <ul className="space-y-4 text-xs">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>Unlimited Roadmaps & active tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>Detailed programming sandboxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>Unlimited resume keyword scans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>Full behavioral & coding interview bots</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/register?plan=premium" 
              className="mt-8 py-3 text-center text-xs font-mono uppercase tracking-wider text-background bg-primary hover:bg-primary/90 rounded transition-all font-bold"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 border-t border-border">
        <div className="text-center mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Documentation</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mt-2 text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-border rounded bg-card/20 overflow-hidden"
            >
              <button
                onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-display font-bold text-sm text-foreground hover:bg-card/45 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activeFAQ === idx ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeFAQ === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-xs text-muted-foreground leading-relaxed font-sans">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT/NEWSLETTER SECTION */}
      <section className="py-24 max-w-3xl mx-auto px-6 border-t border-border text-center">
        <div className="p-8 md:p-12 rounded border border-border bg-card/35 backdrop-blur-md">
          <Mail className="w-8 h-8 text-primary mx-auto mb-6" />
          <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4 text-foreground">
            Stay in the loop
          </h2>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-8 leading-relaxed font-sans">
            Subscribe to our newsletter logs to receive framework roadmaps, study resources, and interview patterns directly.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-grow px-4 py-3 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs font-sans text-foreground"
            />
            <button 
              type="submit" 
              disabled={subscribingNewsletter}
              className="px-6 py-3 bg-primary text-background font-mono uppercase tracking-wider font-bold rounded text-xs shadow hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {subscribingNewsletter ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 bg-card/25">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <BrandLogo />
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            &copy; 2026 RoadmapAI Inc. Built with Space Grotesk, Inter, and IBM Plex Mono.
          </p>
          <div className="flex gap-6 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0">Privacy</button>
            <button onClick={() => setTermsModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0">Terms</button>
            <button onClick={() => setContactModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0">Contact</button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AnimatePresence>
        {/* Privacy Modal */}
        {privacyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border max-w-xl w-full p-6 md:p-8 space-y-4 max-h-[80vh] overflow-y-auto relative rounded shadow-2xl"
            >
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-display font-bold text-foreground">Privacy Policy</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Last updated: August 2026
              </p>
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed font-sans">
                <p>
                  At <strong>RoadmapAI</strong>, we are committed to safeguarding your private data. This document outlines how we collect, store, and process your profile credentials.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">1. Data Collection</h4>
                <p>
                  We store credentials such as your email address, career goals, technical skills, resume texts, and activity heatmap logs to generate customized timelines.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">2. Security & Encryption</h4>
                <p>
                  All active passwords are hashed using bcrypt. Access tokens are transmitted over TLS/SSL and stored securely inside httpOnly client cookies to prevent cross-site scripting (XSS) leaks.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">3. Analytics & Stripe Integration</h4>
                <p>
                  Subscription transactions are handled end-to-end by Stripe. We do not store or process raw credit card credentials on our servers.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Terms Modal */}
        {termsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border max-w-xl w-full p-6 md:p-8 space-y-4 max-h-[80vh] overflow-y-auto relative rounded shadow-2xl"
            >
              <button
                onClick={() => setTermsModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-display font-bold text-foreground">Terms of Service</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Last updated: August 2026
              </p>
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed font-sans">
                <p>
                  By accessing <strong>RoadmapAI</strong>, you agree to comply with our acceptable terms.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">1. Account Provisioning</h4>
                <p>
                  You must provide valid credentials during registration. Sharing account tokens or subverting subscription gates is strictly prohibited.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">2. Acceptable Platform Use</h4>
                <p>
                  Our timeline resources, assessment builders, and interview agents are designed for personal professional coaching. Systematic scraping or copying is a violation of our terms.
                </p>
                <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-widest">3. Service Modifications</h4>
                <p>
                  We reserve the rights to refine, rate-limit, or adjust the limits of free roadmap generations as needed to optimize GPU/LLM request capacities.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Contact Modal */}
        {contactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-card border border-border max-w-md w-full p-6 md:p-8 space-y-5 relative rounded shadow-2xl"
            >
              <button
                onClick={() => setContactModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-foreground">Contact Support</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Send us a message and our support team will reply via email.
                </p>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs font-sans text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs font-sans text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs font-sans resize-none text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="w-full py-3 bg-primary text-background font-mono uppercase tracking-wider font-bold rounded text-xs shadow hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingContact && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Message
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CloudIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.74-3.5-3.5-4.5A4.95 4.95 0 0 0 6 11.5c-2.24.41-4 2.39-4 4.5A3.5 3.5 0 0 0 5.5 19H17.5z" />
    </svg>
  );
}

