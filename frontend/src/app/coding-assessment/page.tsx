'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUserStore } from '@/store/user-store';
import { PremiumUpgradeGate } from '@/components/premium-upgrade-gate';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useCelebration } from '@/components/dashboard-upgrades/celebration-provider';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Cpu,
  Layers,
  MessageSquare,
  Maximize2,
  Minimize2,
  Trash2,
  Terminal as TerminalIcon,
  HelpCircle,
  BookOpen,
  Send,
  Loader2,
  Activity
} from 'lucide-react';

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestCaseOutput {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface ChatInteraction {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

export default function CodingAssessmentPage() {
  const user = useUserStore((state) => state.user);
  const isPremium = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'premium';
  const { triggerCoins, triggerConfetti, triggerLevelUp, triggerBadgeUnlocked } = useCelebration();

  // Settings
  const [topic, setTopic] = useState('Arrays');
  const [language, setLanguage] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState('Medium');

  // Challenge state
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [code, setCode] = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [hintsCount, setHintsCount] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<Record<number, string>>({});
  
  // Console terminal
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'success' | 'compile_error' | 'failed'>('idle');
  const [consoleError, setConsoleError] = useState('');
  const [testResults, setTestResults] = useState<TestCaseOutput[]>([]);
  const [runtimeMs, setRuntimeMs] = useState(0);
  const [memoryMb, setMemoryMb] = useState(0);

  // Editor controls
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AI review & chat
  const [aiReview, setAiReview] = useState<{
    correctness: string;
    timeComplexity: string;
    spaceComplexity: string;
    suggestions: string;
  } | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatInteraction[]>([]);
  const [userChatMsg, setUserChatMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'review' | 'interviewer'>('problem');

  // Generate coding quiz
  const generateQuiz = async () => {
    setRunning(true);
    setAiReview(null);
    setTestResults([]);
    setConsoleStatus('idle');
    setUnlockedHints({});
    setActiveTab('problem');

    try {
      const res = await api.post('/coding/generate', {
        topic,
        language,
        difficulty,
      });

      setAssessmentId(res.data.assessmentId);
      setTitle(res.data.title);
      setDescription(res.data.description);
      setConstraints(res.data.constraints);
      setExamples(res.data.examples);
      setCode(res.data.codeTemplate);
      setDefaultTemplate(res.data.codeTemplate);
      setHintsCount(res.data.hintsCount);
      setChatHistory(res.data.chatInteractions || []);
      toast.success('Successfully synthesized unique coding challenge!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate coding assessment.');
    } finally {
      setRunning(false);
    }
  };

  // Run code against test cases
  const runCode = async () => {
    if (!assessmentId) return;
    setRunning(true);
    setTerminalOpen(true);
    setConsoleStatus('idle');
    setConsoleError('');

    try {
      const res = await api.post('/coding/run', {
        assessmentId,
        code,
      });

      if (res.data.status === 'compile_error') {
        setConsoleStatus('compile_error');
        setConsoleError(res.data.error);
        setTestResults([]);
      } else {
        setConsoleStatus('success');
        setTestResults(res.data.outputs);
        setRuntimeMs(res.data.runtimeMs);
        setMemoryMb(res.data.memoryMb);
        toast.info('Test compilation finished.');
      }
    } catch (err) {
      toast.error('Failed to execute compilation sandbox.');
    } finally {
      setRunning(false);
    }
  };

  // Submit code for grading and XP reward
  const submitCode = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    setTerminalOpen(true);
    setConsoleStatus('idle');
    setConsoleError('');

    try {
      const res = await api.post('/coding/submit', {
        assessmentId,
        code,
      });

      setTestResults(res.data.outputs);
      setConsoleStatus(res.data.isCompleted ? 'success' : 'failed');
      setAiReview(res.data.aiReview);
      
      if (res.data.isCompleted) {
        triggerCoins();
        triggerConfetti();
        toast.success(`Solution accepted! Grade: ${res.data.score}%`);
        setActiveTab('review'); // direct switch to review
      } else {
        toast.warning(`Submission failed. Mismatch on edge-cases.`);
      }
    } catch (err) {
      toast.error('Submission failed. Check network endpoints.');
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock hint costing 50 XP
  const unlockHint = async (idx: number) => {
    if (!assessmentId) return;
    
    // confirm unlock costing XP
    const confirmUnlock = window.confirm('Unlocking this hint costs 50 XP. Do you wish to continue?');
    if (!confirmUnlock) return;

    try {
      const res = await api.post('/coding/hint', {
        assessmentId,
        hintIndex: idx,
      });

      setUnlockedHints((prev) => ({ ...prev, [idx]: res.data.hint }));
      toast.success('Hint unlocked successfully! 50 XP deducted.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not unlock hint.');
    }
  };

  // AI Interviewer Dialogue Submit
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatMsg.trim() || !assessmentId || chatLoading) return;

    setChatLoading(true);
    const msg = userChatMsg;
    setUserChatMsg('');

    // optimism append user chat node
    setChatHistory((prev) => [...prev, { role: 'user', text: msg }]);

    try {
      const res = await api.post('/coding/interviewer', {
        assessmentId,
        message: msg,
      });

      setChatHistory(res.data.chatInteractions);
    } catch (err) {
      toast.error('Interviewer connection lost.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {!isPremium ? (
        <PremiumUpgradeGate 
          featureName="Coding Assessment Sandbox" 
          featureDesc="Test your programming chops with dynamic coding sandboxes, test-case evaluations, and AI mentor review feedback."
        />
      ) : (
        <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto' : ''}`}>
        
        {/* TOP CONFIGURATION ROW */}
        <div className="p-5 rounded-2xl glass-card border border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Topic Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-extrabold">Coding Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-40 block rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {['Arrays', 'Strings', 'HashMap', 'Stack', 'Queue', 'Linked List', 'Trees', 'Heap', 'Graph', 'Recursion', 'Dynamic Programming', 'SQL'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Language Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-extrabold">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-36 block rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'SQL'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-extrabold">Target Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-32 block rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {['Easy', 'Medium', 'Hard', 'Expert', 'FAANG'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>

          <button
            onClick={generateQuiz}
            disabled={running}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {running && !assessmentId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Coding Test...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Assessment Challenge</span>
              </>
            )}
          </button>
        </div>

        {/* HERO STATE */}
        {!assessmentId && (
          <div className="p-12 rounded-2xl glass-card border border-border text-center space-y-6 max-w-xl mx-auto mt-12">
            <Code2 className="w-16 h-16 text-primary mx-auto animate-pulse" />
            <h2 className="text-xl md:text-2xl font-extrabold">AI Coding Sandbox</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Design dynamically randomized algorithmic coding challenges. Never repeats previously generated solutions. Complete with sandbox compilers, execution timers, code review diagnostics, and verbal follow-up panels.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={generateQuiz}
                className="px-5 py-3 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/90 cursor-pointer"
              >
                Start Easy JavaScript Challenge
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE PANELS */}
        {assessmentId && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: MODULE DETAILS */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Tab Header Controls */}
              <div className="flex border-b border-border text-xs font-bold text-muted-foreground">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'problem' ? 'border-primary text-foreground' : 'border-transparent hover:text-foreground/80'}`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('hints')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer relative ${activeTab === 'hints' ? 'border-primary text-foreground' : 'border-transparent hover:text-foreground/80'}`}
                >
                  Hints
                  {hintsCount > 0 && (
                    <span className="absolute right-3 top-2.5 bg-yellow-500/20 text-yellow-500 font-extrabold text-[8px] px-1 rounded-full border border-yellow-500/30">
                      {hintsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('review')}
                  disabled={!aiReview}
                  className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer disabled:opacity-40 ${activeTab === 'review' ? 'border-primary text-foreground' : 'border-transparent hover:text-foreground/80'}`}
                >
                  AI Review
                </button>
                <button
                  onClick={() => setActiveTab('interviewer')}
                  className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'interviewer' ? 'border-primary text-foreground' : 'border-transparent hover:text-foreground/80'}`}
                >
                  AI Interviewer
                </button>
              </div>

              {/* Tab Body Contents */}
              <div className="p-6 rounded-2xl glass-card border border-border space-y-6 min-h-[500px]">
                
                {/* 1. Problem Description */}
                {activeTab === 'problem' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {difficulty}
                        </span>
                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          {topic}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                      {description}
                    </p>

                    {/* Constraints */}
                    {constraints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-wider">Constraints</h4>
                        <ul className="list-disc pl-4 text-xs text-muted-foreground font-medium space-y-1">
                          {constraints.map((c, i) => (
                            <li key={i} className="font-mono bg-muted/20 px-1 py-0.5 rounded w-fit">{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Examples */}
                    {examples.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-wider">Examples</h4>
                        <div className="space-y-3 text-xs font-semibold">
                          {examples.map((ex, i) => (
                            <div key={i} className="p-3 bg-muted/20 border border-border/40 rounded-lg space-y-1.5">
                              <div><span className="text-primary font-bold">Input:</span> <code className="font-mono text-foreground/80">{ex.input}</code></div>
                              <div><span className="text-accent font-bold">Output:</span> <code className="font-mono text-foreground/80">{ex.output}</code></div>
                              {ex.explanation && (
                                <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-medium">{ex.explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Hints unlocked panel */}
                {activeTab === 'hints' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm">Challenge Guide Hints</h3>
                    <p className="text-xs text-muted-foreground leading-normal font-medium">
                      Need help? Unlocking each progressive hint costs <strong className="text-yellow-500">50 XP</strong> from your dashboard points profile.
                    </p>

                    <div className="space-y-3">
                      {Array.from({ length: hintsCount }).map((_, i) => {
                        const isUnlocked = unlockedHints[i] !== undefined;
                        return (
                          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/5 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span>Hint #{i + 1}</span>
                              {isUnlocked ? (
                                <span className="text-green-500 text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                                </span>
                              ) : (
                                <button
                                  onClick={() => unlockHint(i)}
                                  className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[9px] font-extrabold rounded flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Lightbulb className="w-3 h-3" /> Unlock for 50 XP
                                </button>
                              )}
                            </div>
                            {isUnlocked ? (
                              <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                                {unlockedHints[i]}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic font-medium">
                                This hint is locked. Click the unlock button to deduct points and reveal details.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. AI Code Review Diagnostics */}
                {activeTab === 'review' && aiReview && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-extrabold text-sm text-foreground">AI Code Review Analysis</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                        <span className="text-[8px] uppercase font-extrabold text-primary">Time Complexity</span>
                        <p className="font-mono text-sm font-bold text-foreground mt-0.5">{aiReview.timeComplexity}</p>
                      </div>
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl">
                        <span className="text-[8px] uppercase font-extrabold text-accent">Space Complexity</span>
                        <p className="font-mono text-sm font-bold text-foreground mt-0.5">{aiReview.spaceComplexity}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-wider">Correctness Summary</span>
                        <p className="p-3 bg-muted/20 border border-border/40 rounded-lg text-foreground/80 leading-relaxed font-medium">
                          {aiReview.correctness}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-wider">Suggestions & Best Practices</span>
                        <p className="p-3 bg-muted/20 border border-border/40 rounded-lg text-foreground/80 leading-relaxed whitespace-pre-line font-medium">
                          {aiReview.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. AI Interviewer Interactive Panel */}
                {activeTab === 'interviewer' && (
                  <div className="space-y-4 flex flex-col h-[480px]">
                    <div className="flex items-center gap-2 border-b border-border pb-3 shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-extrabold text-sm">AI Interviewer Panel</h3>
                        <p className="text-[10px] text-muted-foreground font-medium">Answer questions about optimization and complexity</p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-1 font-semibold text-xs leading-normal">
                      {chatHistory.map((chat, idx) => {
                        const isAssistant = chat.role === 'assistant';
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${isAssistant ? 'bg-muted/30 text-foreground/90 border border-border/30 mr-auto' : 'bg-primary/10 text-primary border border-primary/20 ml-auto'}`}
                          >
                            <span className="text-[9px] uppercase font-extrabold text-muted-foreground block mb-0.5">
                              {isAssistant ? 'Interviewer' : 'You'}
                            </span>
                            <span className="font-medium">{chat.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-border pt-3 shrink-0">
                      <input
                        type="text"
                        value={userChatMsg}
                        onChange={(e) => setUserChatMsg(e.target.value)}
                        placeholder="Explain your approach..."
                        className="flex-1 rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={chatLoading}
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !userChatMsg.trim()}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT COLUMN: ONLINE EDITOR & COMPILER */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Online Editor workspace */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg flex flex-col min-h-[500px]">
                
                {/* Editor Settings Bar */}
                <div className="p-3 bg-muted/20 border-b border-border flex justify-between items-center text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary" />
                    <span>Workspace Editor ({language})</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Font controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="px-1.5 py-0.5 border border-border/80 rounded bg-muted/30 hover:bg-muted text-[10px] font-bold cursor-pointer">-</button>
                      <span className="text-[10px] font-mono">{fontSize}px</span>
                      <button onClick={() => setFontSize(Math.min(20, fontSize + 1))} className="px-1.5 py-0.5 border border-border/80 rounded bg-muted/30 hover:bg-muted text-[10px] font-bold cursor-pointer">+</button>
                    </div>

                    {/* Reset Code */}
                    <button
                      onClick={() => {
                        if (window.confirm('Reset code to initial boilerplate template?')) {
                          setCode(defaultTemplate);
                        }
                      }}
                      className="px-2 py-1 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 relative flex">
                  
                  {/* Mock Line Numbers */}
                  <div className="w-10 bg-muted/10 border-r border-border/30 text-right select-none text-[10px] text-muted-foreground/40 font-mono py-4 pr-2.5 leading-relaxed space-y-0.5 shrink-0">
                    {Array.from({ length: Math.max(25, code.split('\n').length + 5) }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-transparent p-4 text-foreground/95 font-mono leading-relaxed outline-none border-none resize-none overflow-y-auto"
                    style={{ fontSize: `${fontSize}px` }}
                    placeholder="// Write your code solution logic here..."
                    spellCheck="false"
                  />
                </div>

                {/* Compiler terminal drawer */}
                {terminalOpen && (
                  <div className="border-t border-border bg-muted/5 flex flex-col shrink-0 min-h-[220px]">
                    <div className="p-3 bg-muted/20 border-b border-border flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <TerminalIcon className="w-4 h-4" />
                        <span>Terminal Execution Outputs</span>
                      </div>
                      
                      {/* Compiler Stats */}
                      {consoleStatus === 'success' && (
                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Success
                          </span>
                          <span className="text-muted-foreground flex items-center gap-0.5">
                            <Activity className="w-3.5 h-3.5" /> {runtimeMs}ms
                          </span>
                          <span className="text-muted-foreground">
                            {memoryMb}MB Memory
                          </span>
                        </div>
                      )}

                      {consoleStatus === 'compile_error' && (
                        <span className="text-red-500 font-mono text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Compile Error
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 font-mono text-xs overflow-y-auto leading-relaxed bg-black/40 text-foreground/80 space-y-3">
                      
                      {/* Idle console */}
                      {consoleStatus === 'idle' && (
                        <div className="text-muted-foreground/60 italic font-semibold">
                          Compiler ready. Click 'Run Code' or 'Submit Code' to evaluate logic.
                        </div>
                      )}

                      {/* Compile/syntax errors */}
                      {consoleStatus === 'compile_error' && (
                        <pre className="text-red-400 font-medium whitespace-pre-wrap">{consoleError}</pre>
                      )}

                      {/* Success runs / test case loops */}
                      {consoleStatus === 'success' && testResults.length > 0 && (
                        <div className="space-y-3">
                          {testResults.map((tc, idx) => (
                            <div key={idx} className="p-2 border border-border/20 rounded bg-muted/5 space-y-1">
                              <div className="flex justify-between items-center font-bold text-[10px]">
                                <span className="text-muted-foreground">Case #{idx + 1}</span>
                                {tc.passed ? (
                                  <span className="text-green-500">Passed ✓</span>
                                ) : (
                                  <span className="text-red-400">Failed ✗</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[10px] font-medium mt-1">
                                <div><span className="text-muted-foreground/60 block">Input</span> {tc.input}</div>
                                <div><span className="text-muted-foreground/60 block">Expected</span> {tc.expected}</div>
                                <div><span className="text-muted-foreground/60 block">Actual</span> <code className={tc.passed ? 'text-green-500' : 'text-red-400'}>{tc.actual}</code></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Failed run loops */}
                      {consoleStatus === 'failed' && testResults.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-red-400 font-bold">Grade Failed. Mismatch found on public or hidden test cases.</p>
                          {testResults.slice(0, 1).map((tc, idx) => (
                            <div key={idx} className="p-2.5 border border-red-500/20 bg-red-500/5 rounded text-[10px] font-medium space-y-1">
                              <div><span className="text-muted-foreground/60">Input:</span> {tc.input}</div>
                              <div><span className="text-muted-foreground/60">Expected:</span> {tc.expected}</div>
                              <div><span className="text-muted-foreground/60">Actual:</span> <code className="text-red-400 font-bold">{tc.actual}</code></div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Bottom Trigger actions */}
                <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center">
                  <button
                    onClick={() => setTerminalOpen(!terminalOpen)}
                    className="text-xs font-semibold hover:text-foreground text-muted-foreground flex items-center gap-1 cursor-pointer"
                  >
                    <TerminalIcon className="w-4 h-4" />
                    <span>{terminalOpen ? 'Collapse Console' : 'Expand Console'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={runCode}
                      disabled={running || submitting}
                      className="px-4 py-2 border border-border/80 bg-card/60 hover:bg-muted/40 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>Run Code</span>
                    </button>
                    
                    <button
                      onClick={submitCode}
                      disabled={running || submitting}
                      className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 hover:bg-primary/95 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Submit Code</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        </div>
      )}
    </DashboardLayout>
  );
}
