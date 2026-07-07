'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUserStore } from '@/store/user-store';
import { PremiumUpgradeGate } from '@/components/premium-upgrade-gate';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useCelebration } from '@/components/dashboard-upgrades/celebration-provider';
import {
  UserCheck,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  Send,
  Award,
  Play,
  Clock,
  Sparkles,
  Building,
  Sliders,
  Volume2,
  Activity,
  Eye,
  Terminal,
  Heart,
  FileCheck,
  RotateCcw,
  Zap
} from 'lucide-react';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

interface InterviewSession {
  _id: string;
  type: string;
  company: string;
  difficulty: string;
  duration: number;
  mode: 'practice' | 'strict';
  currentRound: 'coding' | 'behavioral' | 'design' | 'feedback';
  messages: Message[];
  overallScore: number;
  subScores: {
    coding: number;
    communication: number;
    confidence: number;
    technical: number;
    behavior: number;
  };
  liveMetrics: {
    eyeContact: number;
    speakingSpeed: number;
    fillerWords: number;
    stressLevel: number;
  };
  feedback: string;
  submittedCode?: string;
  isCompleted: boolean;
}

export default function MockInterviewPage() {
  const user = useUserStore((state) => state.user);
  const isPremium = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'premium';
  const { triggerCoins, triggerConfetti } = useCelebration();

  // Wizard settings
  const [targetType, setTargetType] = useState('Full Stack');
  const [company, setCompany] = useState('Google');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState<'practice' | 'strict'>('strict');

  // Checklist permission checks
  const [step, setStep] = useState<'config' | 'permissions' | 'active' | 'report'>('config');
  const [camStatus, setCamStatus] = useState<'idle' | 'checking' | 'allowed' | 'failed'>('idle');
  const [micStatus, setMicStatus] = useState<'idle' | 'checking' | 'allowed' | 'failed'>('idle');
  const [internetStatus, setInternetStatus] = useState<'idle' | 'checking' | 'allowed'>('idle');
  const [speechSynthStatus, setSpeechSynthStatus] = useState<'idle' | 'allowed'>('idle');

  // Video & Stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Active Session details
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [editorCode, setEditorCode] = useState('');
  const [fontSize, setFontSize] = useState(14);

  // Speech Recognition STT
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS Voice Synthesis reading questions aloud
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // No simulated metrics — real scores come from AI evaluation in session.liveMetrics

  // Countdown timer clock
  const [timeLeft, setTimeLeft] = useState(0);

  // STT Voice Speech Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          const resultText = event.results[event.results.length - 1][0].transcript;
          setAnswerText((prev) => (prev ? prev + ' ' + resultText : resultText));
        };

        rec.onerror = () => setIsRecording(false);
        rec.onend = () => setIsRecording(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (step === 'active' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (step === 'active' && timeLeft === 0) {
      handleFinishAndEvaluate();
    }
  }, [timeLeft, step]);

  // No simulation loops — metrics are evaluated by AI at interview end

  // Request Camera & Mic streams
  const requestHardwarePermissions = async () => {
    setCamStatus('checking');
    setMicStatus('checking');
    setInternetStatus('checking');

    try {
      const hardwareStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(hardwareStream);
      setCamStatus('allowed');
      setMicStatus('allowed');
      setInternetStatus('allowed');
      setSpeechSynthStatus('allowed');
      toast.success('Camera, Microphone, and Audio APIs initialized successfully.');

      // Bind to preview elements if immediately mounting
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = hardwareStream;
        }
      }, 100);
    } catch (err) {
      setCamStatus('failed');
      setMicStatus('failed');
      toast.error('Permissions denied. Please allow access in browser site settings.');
    }
  };

  // TTS Voice Question Synthesizer
  const speakInterviewerQuestion = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel(); // clear queue
    const cleanedText = text.replace(/[#*`_]/g, ''); // strip markdown
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (targetVoice) utterance.voice = targetVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize and Launch mock session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);

    try {
      const res = await api.post('/interviews/start', {
        type: targetType,
        company,
        difficulty,
        duration,
        mode,
      });

      const activeSession = res.data.session;
      setSession(activeSession);
      setTimeLeft(duration * 60);
      setStep('active');

      // Setup default coding templates if needed
      setEditorCode(`function optimizeImplementation(data) {\n  // Google Tech Interview: Solve here\n  return null;\n}`);

      toast.success(`Google-grade Mock ${targetType} Interview Started!`);

      // Read welcome aloud
      if (activeSession.messages.length > 0) {
        speakInterviewerQuestion(activeSession.messages[0].content);
      }
    } catch (err) {
      toast.error('Failed to initialize Mock Interview session.');
    } finally {
      setStarting(false);
    }
  };

  // Submit Answer (with optional code state)
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !session || submitting) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setSubmitting(true);
    const textToSend = answerText;
    setAnswerText('');

    try {
      const res = await api.post('/interviews/submit', {
        sessionId: session._id,
        answerText: textToSend,
        submittedCode: session.currentRound === 'coding' ? editorCode : undefined,
      });

      const updatedSession = res.data.session;
      setSession(updatedSession);

      // Read AI next question aloud
      const lastMsg = updatedSession.messages[updatedSession.messages.length - 1];
      if (lastMsg && lastMsg.role === 'interviewer') {
        speakInterviewerQuestion(lastMsg.content);
      }
      toast.success('Answer uploaded successfully.');
    } catch (err) {
      toast.error('Failed to register answer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stop interview and run review evaluation
  const handleFinishAndEvaluate = async () => {
    if (!session) return;
    if (session.messages.length < 3) {
      toast.warning('Transcript too short. Please answer a couple of questions.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    window.speechSynthesis.cancel(); // mute vocalizer

    setFinishing(true);
    try {
      const res = await api.post('/interviews/evaluate', {
        sessionId: session._id,
      });

      setSession(res.data.session);
      setStep('report');
      triggerCoins();
      triggerConfetti();
      toast.success('Interview evaluation report generated!');

      // Close video hardware stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    } catch (err) {
      toast.error('Evaluation processing failed.');
    } finally {
      setFinishing(false);
    }
  };

  // Toggle Dictation voice input
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.warning('Speech recognition is not supported in this browser. Please type your responses.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info('Voice dictation paused.');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success('Voice dictation active. Speak now...');
    }
  };

  // Format countdown clock timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <DashboardLayout>
      {!isPremium ? (
        <PremiumUpgradeGate 
          featureName="Mock Technical Interview" 
          featureDesc="Simulate live developer coding and HR interview rounds with structured real-time speech and metrics feedback bots."
        />
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
        
        {/* STEP 1: CONFIGURATION WIZARD SCREEN */}
        {step === 'config' && (
          <div className="max-w-xl mx-auto p-8 rounded-2xl glass-card border border-border space-y-6">
            <div className="text-center space-y-2">
              <UserCheck className="w-12 h-12 text-primary mx-auto animate-pulse" />
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground">AI Mock Interview Board</h2>
              <p className="text-muted-foreground text-xs font-semibold leading-relaxed">
                Design custom mock interviews modeled on Google, Microsoft, and OpenAI staff screening tests.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep('permissions'); }} className="space-y-4 font-semibold text-xs leading-normal">
              
              {/* Target Focus Type */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase font-extrabold">Interview Focus Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full block rounded-lg border border-border bg-muted/40 p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {['Frontend', 'Backend', 'Full Stack', 'AI Engineer', 'DevOps', 'Software Engineer'].map((t) => (
                    <option key={t} value={t}>{t} Focus</option>
                  ))}
                </select>
              </div>

              {/* Target Company Selection */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase font-extrabold">Target Company Style</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full block rounded-lg border border-border bg-muted/40 p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple', 'Stripe', 'OpenAI', 'Zomato'].map((c) => (
                    <option key={c} value={c}>{c} Style</option>
                  ))}
                </select>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Target Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] uppercase font-extrabold">Difficulty Scale</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full block rounded-lg border border-border bg-muted/40 p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {['Easy', 'Medium', 'Hard', 'Expert', 'FAANG'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] uppercase font-extrabold">Duration Period</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full block rounded-lg border border-border bg-muted/40 p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[15, 30, 45, 60].map((mins) => (
                      <option key={mins} value={mins}>{mins} Minutes</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Mode Select toggle buttons */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-[10px] uppercase font-extrabold">Assessment Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('practice')}
                    className={`p-3 rounded-lg border text-xs font-bold text-center flex flex-col items-center justify-center cursor-pointer transition-all ${mode === 'practice' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/30'}`}
                  >
                    <span>Practice Mode</span>
                    <span className="text-[9px] font-medium text-muted-foreground mt-0.5">Hints allowed • Unrestricted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('strict')}
                    className={`p-3 rounded-lg border text-xs font-bold text-center flex flex-col items-center justify-center cursor-pointer transition-all ${mode === 'strict' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/30'}`}
                  >
                    <span>Strict Mode</span>
                    <span className="text-[9px] font-medium text-muted-foreground mt-0.5">Timer enabled • Tab monitor checks</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer pt-4"
              >
                <span>Continue to Hardware Check</span>
                <Play className="w-4 h-4" />
              </button>

            </form>
          </div>
        )}

        {/* STEP 2: HARDWARE COMPATIBILITY CHECK SCREEN */}
        {step === 'permissions' && (
          <div className="max-w-xl mx-auto p-8 rounded-2xl glass-card border border-border space-y-6">
            <div className="text-center space-y-1">
              <Sliders className="w-10 h-10 text-primary mx-auto animate-pulse" />
              <h3 className="text-lg font-extrabold">Device Compatibility Check</h3>
              <p className="text-muted-foreground text-xs font-medium">Verify your camera and microphone operate correctly before commencing.</p>
            </div>

            {/* Webcam Live Preview Box */}
            <div className="w-full aspect-video rounded-xl bg-black border border-border/80 overflow-hidden relative flex items-center justify-center">
              {camStatus === 'allowed' ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="text-center text-xs text-muted-foreground p-6">
                  <VideoOff className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <span>Hardware preview feed inactive. Allow camera triggers.</span>
                </div>
              )}
            </div>

            {/* Verification checklist items */}
            <div className="space-y-3">
              
              {/* Cam check */}
              <div className="flex justify-between items-center text-xs font-bold p-3 border border-border/40 bg-muted/20 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-primary" />
                  <span>Webcam Preview Feed</span>
                </span>
                {camStatus === 'allowed' ? (
                  <span className="text-green-500 text-[10px] uppercase font-bold">Initialized</span>
                ) : camStatus === 'failed' ? (
                  <span className="text-red-500 text-[10px] uppercase font-bold">Failed</span>
                ) : (
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Pending</span>
                )}
              </div>

              {/* Mic check */}
              <div className="flex justify-between items-center text-xs font-bold p-3 border border-border/40 bg-muted/20 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-accent" />
                  <span>Microphone Transcriptions</span>
                </span>
                {micStatus === 'allowed' ? (
                  <span className="text-green-500 text-[10px] uppercase font-bold">Initialized</span>
                ) : micStatus === 'failed' ? (
                  <span className="text-red-500 text-[10px] uppercase font-bold">Failed</span>
                ) : (
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Pending</span>
                )}
              </div>

              {/* Internet connection speed check */}
              <div className="flex justify-between items-center text-xs font-bold p-3 border border-border/40 bg-muted/20 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  <span>Voice Audio Synthesis Speech</span>
                </span>
                {speechSynthStatus === 'allowed' ? (
                  <span className="text-green-500 text-[10px] uppercase font-bold">Ready</span>
                ) : (
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Pending</span>
                )}
              </div>

            </div>

            {/* Triggers */}
            <div className="space-y-3">
              {camStatus !== 'allowed' && (
                <button
                  onClick={requestHardwarePermissions}
                  className="w-full py-3 bg-secondary hover:bg-secondary/90 text-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Activity className="w-4 h-4 animate-spin-slow" />
                  <span>Initialize Hardware Permissions</span>
                </button>
              )}

              {camStatus === 'allowed' && (
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:brightness-105 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Boardroom Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Commence Mock Interview</span>
                      <Play className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

        {/* STEP 3: ACTIVE INTERVIEW PANEL */}
        {step === 'active' && session && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: INTERVIEWER CONSOLE, TIMER, WEBCAM */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Header Details */}
              <div className="p-4 rounded-xl border border-border bg-card/15 flex justify-between items-center text-xs font-bold">
                <div className="flex gap-2 items-center">
                  <Building className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{session.company}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono">{formatTime(timeLeft)} Remaining</span>
                </div>
              </div>

              {/* AI Interviewer Avatar Console */}
              <div className="p-6 rounded-2xl glass-card border border-border space-y-4 relative overflow-hidden min-h-[190px]">
                
                {/* Branding background watermark */}
                <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                  <UserCheck className="w-32 h-32 text-primary" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] uppercase font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Interviewer Status
                    </span>
                    <h4 className="text-sm font-extrabold text-foreground mt-1">Staff Engineer ({session.type})</h4>
                  </div>
                  
                  {/* Voice speak aloud config */}
                  <button
                    onClick={() => {
                      setTtsEnabled(!ttsEnabled);
                      if (ttsEnabled) window.speechSynthesis.cancel();
                    }}
                    className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${ttsEnabled ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                    title="Vocalize questions"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question bubble */}
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-semibold mt-2">
                  {session.messages[session.messages.length - 1]?.content}
                </p>
              </div>

              {/* Live Webcam Feed */}
              <div className="p-6 rounded-2xl glass-card border border-border space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span>Candidate Feed Preview</span>
                  <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> Live
                  </span>
                </div>

                <div className="w-full aspect-video rounded-xl bg-black border border-border/80 overflow-hidden relative">
                  {stream ? (
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = stream;
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
                      <VideoOff className="w-6 h-6 mb-1 mx-auto" />
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground font-semibold text-center">
                  AI will evaluate your performance metrics at the end of the interview.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: CODE EDITOR & SUBMISSIONS CONSOLE */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Workspace Board Container */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg flex flex-col min-h-[520px]">
                
                {/* Editor settings bar */}
                <div className="p-3 bg-muted/20 border-b border-border flex justify-between items-center text-xs font-semibold">
                  
                  {/* Round indicators */}
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Round: {session.currentRound}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Font controls */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="px-1.5 py-0.5 border border-border/80 rounded bg-muted/30 hover:bg-muted text-[10px] font-bold cursor-pointer">-</button>
                      <span className="text-[10px] font-mono">{fontSize}px</span>
                      <button onClick={() => setFontSize(Math.min(20, fontSize + 1))} className="px-1.5 py-0.5 border border-border/80 rounded bg-muted/30 hover:bg-muted text-[10px] font-bold cursor-pointer">+</button>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('Reset code workspace?')) {
                          setEditorCode(`function optimizeImplementation(data) {\n  // Google Tech Interview: Solve here\n  return null;\n}`);
                        }
                      }}
                      className="px-2 py-1 text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>

                </div>

                {/* Content box depending on round type */}
                <div className="flex-1 relative flex flex-col min-h-[300px]">
                  
                  {session.currentRound === 'coding' ? (
                    // Coding workspace
                    <div className="flex flex-1 relative">
                      <div className="w-10 bg-muted/10 border-r border-border/30 text-right select-none text-[10px] text-muted-foreground/40 font-mono py-4 pr-2.5 leading-relaxed space-y-0.5 shrink-0">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <textarea
                        value={editorCode}
                        onChange={(e) => setEditorCode(e.target.value)}
                        className="flex-1 bg-transparent p-4 text-foreground/95 font-mono leading-relaxed outline-none border-none resize-none overflow-y-auto"
                        style={{ fontSize: `${fontSize}px` }}
                        spellCheck="false"
                      />
                    </div>
                  ) : (
                    // Text behavioral / System design canvas
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="flex-1 bg-transparent p-6 text-foreground/90 font-semibold text-xs leading-relaxed outline-none border-none resize-none overflow-y-auto"
                      placeholder="Type your structured conversational explanation here..."
                      style={{ fontSize: `${fontSize}px` }}
                    />
                  )}

                </div>

                {/* Submissions actions bar */}
                <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
                  
                  {/* Dictation triggers */}
                  <button
                    onClick={toggleRecording}
                    className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${isRecording ? 'border-red-500/20 bg-red-500/10 text-red-500' : 'border-border text-muted-foreground hover:bg-muted/30'}`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Mute Dictation' : 'Speak Answer'}</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleFinishAndEvaluate}
                      disabled={finishing || submitting}
                      className="px-4 py-2 border border-border/80 bg-card/60 hover:bg-muted/40 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      {finishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5 text-accent" />}
                      <span>End & Evaluate</span>
                    </button>

                    <button
                      onClick={handleSubmitResponse}
                      disabled={submitting || finishing}
                      className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 hover:bg-primary/95 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Submit Answer</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

        {/* STEP 4: INTERVIEW GRADE REPORT SCREEN */}
        {step === 'report' && session && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Top metrics grids */}
            <div className="grid md:grid-cols-3 gap-6 items-start">
              
              {/* 1. Overall Score card */}
              <div className="p-6 rounded-2xl glass-card border border-border text-center space-y-4 flex flex-col items-center justify-center min-h-[220px]">
                <Award className="w-12 h-12 text-yellow-500" />
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-extrabold">Overall Interview Score</span>
                  <div className="text-4xl font-extrabold text-foreground mt-1">
                    {session.overallScore}<span className="text-lg text-muted-foreground/60">/100</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 font-extrabold text-[10px] rounded-full border border-green-500/20">
                  {session.overallScore >= 80 ? 'Hire (Strong)' : 'Needs Work'}
                </span>
              </div>

              {/* 2. Radar score chart */}
              <div className="p-6 rounded-2xl glass-card border border-border flex flex-col items-center justify-center min-h-[220px]">
                <span className="text-[10px] text-muted-foreground uppercase font-extrabold mb-3">Sub-score Vector Breakdown</span>
                
                {/* SVG Radar charts representation */}
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  {/* Pentagons */}
                  <polygon points="50,10 90,40 75,85 25,85 10,40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
                  <polygon points="50,25 80,47 68,80 32,80 20,47" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2" />
                  <polygon points="50,40 70,55 60,75 40,75 30,55" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2" />
                  
                  {/* Lines from center */}
                  <line x1="50" y1="50" x2="50" y2="10" stroke="var(--border)" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="90" y2="40" stroke="var(--border)" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="75" y2="85" stroke="var(--border)" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="25" y2="85" stroke="var(--border)" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="10" y2="40" stroke="var(--border)" strokeWidth="0.5" />

                  {/* Dynamic Score Pentagon (computed from subScores values) */}
                  {(() => {
                    const c = session.subScores.coding / 100;
                    const cm = session.subScores.communication / 100;
                    const cf = session.subScores.confidence / 100;
                    const tc = session.subScores.technical / 100;
                    const bh = session.subScores.behavior / 100;

                    const p1 = `50,${50 - (40 * c)}`;
                    const p2 = `${50 + (40 * cm * Math.sin(Math.PI * 0.4))},${50 - (40 * cm * Math.cos(Math.PI * 0.4))}`;
                    const p3 = `${50 + (25 * cf * Math.sin(Math.PI * 0.8))},${50 + (35 * cf * Math.cos(Math.PI * 0.8))}`;
                    const p4 = `${50 - (25 * tc * Math.sin(Math.PI * 0.8))},${50 + (35 * tc * Math.cos(Math.PI * 0.8))}`;
                    const p5 = `${50 - (40 * bh * Math.sin(Math.PI * 0.4))},${50 - (40 * bh * Math.cos(Math.PI * 0.4))}`;

                    return (
                      <polygon
                        points={`${p1} ${p2} ${p3} ${p4} ${p5}`}
                        fill="rgba(139, 92, 246, 0.2)"
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                      />
                    );
                  })()}
                </svg>

                {/* Score list labels */}
                <div className="flex flex-wrap gap-2 justify-center mt-3 text-[9px] font-bold text-muted-foreground">
                  <span className="text-primary">Coding</span>
                  <span className="text-accent">Communication</span>
                  <span className="text-green-500">Technical</span>
                  <span className="text-yellow-500">Behavior</span>
                </div>
              </div>

              {/* 3. Live performance focus analytics */}
              <div className="p-6 rounded-2xl glass-card border border-border space-y-3.5 min-h-[220px]">
                <span className="text-[10px] text-muted-foreground uppercase font-extrabold block">Live Attention timeline metrics</span>
                
                <div className="space-y-2.5 text-xs font-semibold">
                  {/* Eye contact */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-primary" /> Eye Contact
                    </span>
                    <span className="font-mono">{session.liveMetrics.eyeContact}% Rating</span>
                  </div>

                  {/* Filler words */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-accent" /> Filler Words
                    </span>
                    <span className="font-mono">{session.liveMetrics.fillerWords} Detected</span>
                  </div>

                  {/* Speaking Speed */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-500" /> Speaking Speed
                    </span>
                    <span className="font-mono">{session.liveMetrics.speakingSpeed} Words/Min</span>
                  </div>

                  {/* Stress Level */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Stress Index
                    </span>
                    <span className="font-mono">{session.liveMetrics.stressLevel}/100</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Markdown detailed report */}
            <div className="p-6 rounded-2xl glass-card border border-border space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground">AI Boardroom Transcript Evaluation</h3>
              </div>
              <div className="prose prose-invert prose-xs max-w-none text-xs font-semibold leading-relaxed text-foreground/80 whitespace-pre-line font-medium">
                {session.feedback}
              </div>
            </div>

            {/* Explorer Drawer Action */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setStep('config')}
                className="px-6 py-3 bg-secondary text-foreground text-xs font-bold rounded-lg hover:bg-secondary/90 cursor-pointer"
              >
                Schedule Next Interview
              </button>
            </div>

          </div>
        )}

        </div>
      )}
    </DashboardLayout>
  );
}
