'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/logo';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme as useNextTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Map, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Cpu, 
  Layout, 
  Flame, 
  LineChart, 
  ArrowRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Mail, 
  BookOpen, 
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

  const categories = [
    { title: 'AI & Machine Learning', icon: Cpu, desc: 'Generative AI, Deep Learning architectures, model optimization, PyTorch, HuggingFace.' },
    { title: 'Full Stack Development', icon: Layout, desc: 'Next.js, React 19, TypeScript, Express, Mongoose, PostgreSQL, state machines.' },
    { title: 'Cloud & DevOps Engineering', icon: CloudIcon, desc: 'AWS scaling, Docker containers, Kubernetes, GitHub Actions, Terraform configurations.' },
    { title: 'Cyber Security', icon: ShieldCheck, desc: 'Penetration testing, encryption systems, network forensics, API token security.' },
    { title: 'Blockchain & Web3', icon: Terminal, desc: 'Solidity contracts, decentralized apps, Ethereum, Ethers.js, consensus algorithms.' },
    { title: 'UI/UX & Product Design', icon: Compass, desc: 'Apple design system guidelines, glassmorphic interfaces, Figma flows, interactions.' },
  ];

  const features = [
    { title: 'AI Roadmap Generator', desc: 'Generate multi-month structures with weekly milestones, daily subtasks, coding practices, and curated YouTube/documentation materials.', icon: Map },
    { title: 'Interactive Assessments', desc: 'Evaluate your technical skills using dynamic programming MCQs and logical quizzes to isolate weaker areas.', icon: Sparkles },
    { title: 'ATS Resume Review', desc: 'Scan and review resume keywords against specific job targets, returning ATS scores and format improvements.', icon: UserCheck },
    { title: 'Mock Technical Interviews', desc: 'Simulate technical or behavioral interview loops with structured question trees and performance ratings.', icon: UserCheck },
  ];

  const faqList = [
    { q: 'How does the AI Roadmap Generator create recommendations?', a: 'Our system analyzes your starting tech stack, career targets, learning style, and daily hours. It uses the Gemini 2.5 engine to synthesize a logical, step-by-step learning progression, complete with curated references and coding assignments.' },
    { q: 'Can I track my progress and maintain streaks?', a: 'Yes! Every time you mark a daily roadmap task completed, you gain 15 XP points, update your activity calendar heatmap, and increment your active learning streak count.' },
    { q: 'Is there a limit to how many roadmaps I can generate?', a: 'Free accounts can generate up to 2 active roadmaps. Premium subscribers get unlimited roadmap generations, custom resume analyses, and access to all mock interview sessions.' },
    { q: 'Can I export my data or get a certificate?', a: 'Upon completing 100% of a generated roadmap, you unlock a verification certificate featuring a unique credential ID suitable for LinkedIn and CV sharing.' }
  ];

  const [activeStep, setActiveStep] = useState(0);

  const processSteps = [
    {
      num: '01',
      title: 'Profile Analysis',
      desc: 'Define your starting tech stack, career target, and daily hours.',
      details: 'Our systems analyze real-time market requirements, framework dependencies, and job descriptions to establish a highly customized baseline for your journey.'
    },
    {
      num: '02',
      title: 'Synthesize Roadmap',
      desc: 'Generate custom monthly milestones, weekly goals, and daily tasks.',
      details: 'Get direct access to curated video links, reference documentations, and hands-on coding exercises structured for active learning and retention.'
    },
    {
      num: '03',
      title: 'Skill Assessments',
      desc: 'Test your understanding with dynamic coding sandboxes and quizzes.',
      details: 'Isolate weaker topics and get direct feedback. Coding challenges and conceptual MCQs dynamically adapt as your XP score increases.'
    },
    {
      num: '04',
      title: 'Resume Diagnostic',
      desc: 'Review formatting and scan keywords against targeted roles.',
      details: 'Increase your ATS score by discovering missing frameworks, standard keywords, and structural profile gaps to stand out to automated systems.'
    },
    {
      num: '05',
      title: 'Mock Interviews',
      desc: 'Simulate full technical or behavioral interview loops.',
      details: 'Interact with AI interview agents inside our code execution sandbox. Learn how to structure answers and optimize algorithm complexities.'
    }
  ];

  return (
    <div className="min-h-screen font-sans bg-background text-foreground transition-colors duration-300 relative bg-grid-mesh">
      
      {/* Subtle Aurora light backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-foreground/3 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-foreground/2 rounded-full blur-[150px] pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#process" className="hover:text-foreground transition-colors">Our Process</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#categories" className="hover:text-foreground transition-colors">Paths</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQs</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link href="/login" className="text-sm font-semibold hover:text-foreground transition-colors text-muted-foreground">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-bold text-background bg-foreground hover:bg-foreground/90 rounded-md transition-all active:scale-95"
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
            className="fixed inset-x-0 top-16 z-40 p-6 bg-background border-b border-border md:hidden flex flex-col gap-4 text-center font-medium"
          >
            <a href="#process" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Our Process</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Features</a>
            <a href="#categories" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Paths</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">FAQs</a>
            <hr className="border-border" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link 
              href="/register" 
              onClick={() => setMobileMenuOpen(false)} 
              className="py-3 bg-foreground text-background rounded-md font-bold text-sm"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30 text-xs text-foreground font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next Generation Career roadmap simulator</span>
          </div>

          <h1 className="max-w-4xl font-display font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight text-foreground">
            Tech Careers are not born. <br />
            They are <span className="underline decoration-1 underline-offset-8">trained.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            The AI agent workforce that designs customized training environments, feedback loops, and evaluation pipelines to bridge your gap to tech mastery.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Link 
              href="/register" 
              className="flex-1 px-6 py-3.5 text-sm font-bold text-background bg-foreground hover:bg-foreground/90 rounded-md transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <span>Explore Roadmaps</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="flex-1 px-6 py-3.5 text-sm font-semibold border border-border hover:bg-muted rounded-md transition-colors flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* HERO FLOAT CARD (Mockup Screen) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-16 md:mt-24 max-w-4xl mx-auto rounded-lg overflow-hidden border border-border bg-card shadow-2xl relative"
        >
          {/* Windows title bar mockup */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">roadmap_agent_runtime.sh</span>
            <div className="w-10" />
          </div>

          <div className="bg-background p-4 md:p-8 grid md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 text-foreground">
                <Map className="w-4.5 h-4.5 text-foreground" />
                <span>AI Engineering Training Roadmap</span>
                <span className="px-2 py-0.5 text-[10px] border border-border rounded-full font-medium text-muted-foreground bg-muted/50">Active Session</span>
              </h3>
              
              <div className="p-4 rounded-md border border-border bg-muted/10 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Module 1: Transformers & LLM Architectures</span>
                  <span>45% Complete</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-foreground h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/5">
                  <Flame className="w-4 h-4 text-foreground animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Daily Activity Streak</h4>
                    <p className="text-[11px] text-muted-foreground">Daily pipeline evaluation successful. Streak: 12 days (+15 XP)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pb-1">Evaluations</h4>
              
              <div className="space-y-3 font-medium text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
                    <span>Python Runtime</span>
                    <span className="text-foreground">90%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div className="bg-foreground h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
                    <span>Model Fine-tuning</span>
                    <span className="text-foreground">55%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div className="bg-foreground/60 h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
                    <span>RLHF Pipeline</span>
                    <span className="text-foreground">30%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div className="bg-foreground/30 h-full rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PROCESS TIMELINE SECTION (Ethara style) */}
      <section id="process" className="py-20 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Stepped Lifecycle</span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-2 text-foreground">
            Our Training Process
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            How our platform guides you from your current skill parameters to job-ready expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-2">
          {processSteps.map((step, idx) => (
            <div 
              key={idx}
              onMouseEnter={() => setActiveStep(idx)}
              onClick={() => setActiveStep(idx)}
              className={`p-6 border rounded-lg transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                activeStep === idx 
                  ? 'border-foreground bg-muted/20 shadow-md' 
                  : 'border-border bg-card/25 hover:border-muted-foreground/50'
              }`}
            >
              <div>
                <span className={`font-mono text-2xl font-bold tracking-tight block ${
                  activeStep === idx ? 'text-foreground' : 'text-muted-foreground/40'
                }`}>
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-sm mt-4 text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Process Detail Showcase Box */}
        <div className="mt-6 p-6 md:p-8 border border-border bg-card rounded-lg relative overflow-hidden min-h-[140px] flex items-center justify-between">
          <div className="max-w-3xl">
            <h4 className="font-display font-extrabold text-base text-foreground flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
                Step {processSteps[activeStep].num} Detail
              </span>
              <span>{processSteps[activeStep].title}</span>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {processSteps[activeStep].details}
            </p>
          </div>
          <div className="hidden md:block opacity-10">
            <Compass className="w-24 h-24" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Core Modules</span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-2 text-foreground">
            Platform Capabilities
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Everything you need to successfully transition careers or master new technical domains in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card flex flex-col justify-between hover:border-foreground/50 transition-all duration-300"
              >
                <div>
                  <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center text-foreground mb-6">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-foreground mb-2">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PATHS SECTION */}
      <section id="categories" className="py-20 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Pre-configured Tracks</span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-2 text-foreground">
            Explore Curated Careers
          </h2>
          <p className="mt-4 text-muted-foreground text-sm">
            Generate structures and roadmaps across the most demanded fields in industry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-foreground/45 transition-all duration-300">
                <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center text-foreground mb-6">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-display font-bold text-sm text-foreground mb-2">{cat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-6 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Scaling Plans</span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-2 text-foreground">
            Transparent Pricing
          </h2>
          <p className="mt-4 text-muted-foreground text-sm">
            Choose the plan that matches your current speed of professional growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-lg border border-border bg-card/45 flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Standard</span>
              <h3 className="text-2xl font-display font-extrabold mt-2 text-foreground">Free Plan</h3>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Perfect for students and developers starting to organize simple learning goals.
              </p>
              <div className="my-8 text-4xl font-display font-extrabold text-foreground">
                $0 <span className="text-xs font-medium text-muted-foreground">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-xs font-medium">
                <li className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-foreground" />
                  <span>2 Active Roadmaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-foreground" />
                  <span>Standard AI assessments</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground/40">
                  <X className="w-4 h-4" />
                  <span>ATS Resume evaluations</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground/40">
                  <X className="w-4 h-4" />
                  <span>Mock technical interviews</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/register" 
              className="mt-8 py-3 text-center text-xs font-bold border border-border hover:bg-muted rounded-md transition-colors text-foreground"
            >
              Get Started Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded-lg border border-foreground bg-card/60 flex flex-col justify-between relative overflow-hidden">
            {/* Pop highlight */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-foreground text-background text-[9px] uppercase tracking-wider font-extrabold rounded-bl">
              Popular
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-foreground font-bold">Accelerate</span>
              <h3 className="text-2xl font-display font-extrabold mt-2 text-foreground">Premium Pro</h3>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Designed for engineers preparing to clear FAANG-level technical interview rounds.
              </p>
              <div className="my-8 text-4xl font-display font-extrabold text-foreground">
                $1.1 <span className="text-xs font-medium text-muted-foreground">/ month</span>
              </div>
              <ul className="space-y-3.5 text-xs font-medium">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span>Unlimited Roadmaps & AI updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span>Detailed programming MCQ sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span>Unlimited ATS resume reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span>Live mock coding & HR interview bots</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/register?plan=premium" 
              className="mt-8 py-3 text-center text-xs font-bold text-background bg-foreground hover:bg-foreground/90 rounded-md transition-all shadow-sm"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6 border-t border-border">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Answers</span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-2 text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-border rounded-md overflow-hidden bg-card/25"
            >
              <button
                onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-bold text-sm text-foreground hover:bg-muted/40 transition-colors"
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
                    <p className="px-6 pb-6 text-xs text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-20 max-w-3xl mx-auto px-6 border-t border-border text-center">
        <div className="p-8 md:p-12 rounded-lg border border-border bg-card">
          <Mail className="w-8 h-8 text-foreground mx-auto mb-6" />
          <h2 className="text-2xl md:text-4xl font-display font-extrabold tracking-tight mb-4 text-foreground">
            Stay in the loop
          </h2>
          <p className="text-muted-foreground text-xs max-w-md mx-auto mb-8 leading-relaxed">
            Subscribe to our pipeline logs to receive the latest roadmaps, study resources, and interview patterns directly.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-grow px-4 py-3 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs font-semibold"
            />
            <button 
              type="submit" 
              disabled={subscribingNewsletter}
              className="px-6 py-3 bg-foreground text-background font-bold rounded text-xs shadow hover:bg-foreground/90 transition-all disabled:opacity-50"
            >
              {subscribingNewsletter ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <BrandLogo />
          <p className="text-[11px] text-muted-foreground">
            &copy; 2026 Roadmap.AI Inc. Built with Next.js 15, Tailwind v4 and Framer Motion.
          </p>
          <div className="flex gap-6 text-[11px] text-muted-foreground font-semibold">
            <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">Privacy</button>
            <button onClick={() => setTermsModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">Terms</button>
            <button onClick={() => setContactModalOpen(true)} className="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">Contact</button>
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-background border border-border max-w-xl w-full p-6 md:p-8 space-y-4 max-h-[80vh] overflow-y-auto relative rounded-lg shadow-2xl"
            >
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-display font-extrabold text-foreground">Privacy Policy</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Last updated: June 2026
              </p>
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                  At <strong>Roadmap.AI</strong>, we are committed to safeguarding your private data. This document outlines how we collect, store, and process your profile credentials.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">1. Data Collection</h4>
                <p>
                  We store credentials such as your email address, career goals, technical skills, resume texts, and activity heatmap logs to generate customized timelines.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">2. Security & Encryption</h4>
                <p>
                  All active passwords are hashed using bcrypt. Access tokens are transmitted over TLS/SSL and stored securely inside httpOnly client cookies to prevent cross-site scripting (XSS) leaks.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">3. Analytics & Stripe Integration</h4>
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-background border border-border max-w-xl w-full p-6 md:p-8 space-y-4 max-h-[80vh] overflow-y-auto relative rounded-lg shadow-2xl"
            >
              <button
                onClick={() => setTermsModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-display font-extrabold text-foreground">Terms of Service</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Last updated: June 2026
              </p>
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                  By accessing <strong>Roadmap.AI</strong>, you agree to comply with our acceptable terms.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">1. Account Provisioning</h4>
                <p>
                  You must provide valid credentials during registration. Sharing account tokens or subverting subscription gates is strictly prohibited.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">2. Acceptable Platform Use</h4>
                <p>
                  Our timeline resources, assessment builders, and interview agents are designed for personal professional coaching. Systematic scraping or copying is a violation of our terms.
                </p>
                <h4 className="font-bold font-display text-foreground text-xs uppercase tracking-wide">3. Service Modifications</h4>
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-background border border-border max-w-md w-full p-6 md:p-8 space-y-5 relative rounded-lg shadow-2xl"
            >
              <button
                onClick={() => setContactModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-extrabold text-foreground">Contact Support</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Send us a message and our support team will reply via email.
                </p>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs font-semibold text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs font-semibold text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                    className="w-full px-3.5 py-2.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs font-semibold resize-none text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="w-full py-3 bg-foreground text-background font-bold rounded text-xs shadow hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
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

// Simple fallback CloudIcon since Lucide renamed it or in case it misses in local builds
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
