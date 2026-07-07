'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUserStore } from '@/store/user-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2,
  Sparkles, Clock, Trash2, BarChart2, BookOpen, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResumeAnalysis {
  _id: string;
  fileName: string;
  atsScore: number;
  feedback: string;
  keywords: string[];
  improvements: string[];
  createdAt: string;
}

export default function ResumeAnalyzerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<ResumeAnalysis | null>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/resumes/history');
      setHistory(res.data.history || []);
      if (res.data.history?.length > 0 && !activeAnalysis) {
        setActiveAnalysis(res.data.history[0]);
      }
    } catch {
      // No history yet is OK
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Only PDF files are supported.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Only PDF files are supported.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await api.post('/resumes/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const analysis = res.data.analysis;
      setActiveAnalysis(analysis);
      setHistory((prev) => [analysis, ...prev]);
      setSelectedFile(null);
      toast.success('Resume analyzed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="p-6 rounded-2xl glass-card bg-gradient-to-r from-primary/10 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Resume Analyzer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Upload your PDF resume — Gemini AI evaluates ATS score, keywords & improvements.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Upload Panel */}
            <div className="lg:col-span-1 space-y-4">

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[180px]
                  ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card/10'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                <div className="p-3 bg-muted rounded-full text-muted-foreground">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-foreground">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">PDF files only (Max 5MB)</p>
                </div>
              </div>

              {selectedFile && (
                <button
                  onClick={handleAnalyze}
                  disabled={uploading}
                  className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              )}

              {/* History list */}
              <div className="p-5 rounded-2xl glass-card border border-border bg-card/20 space-y-3.5">
                <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Past Uploads
                </h4>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground leading-normal font-semibold">No analysis history found.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {history.map((h) => (
                      <button
                        key={h._id}
                        onClick={() => setActiveAnalysis(h)}
                        className={`
                          w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors text-xs font-bold
                          ${activeAnalysis?._id === h._id 
                            ? 'border-primary/50 bg-primary/5 text-primary' 
                            : 'border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground'}
                        `}
                      >
                        <span className="truncate flex-1">{h.fileName || 'Resume'}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${getScoreColor(h.atsScore)}`}>
                          {h.atsScore}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT: Results panel */}
            <div className="lg:col-span-2">
              {activeAnalysis ? (
                <div className="space-y-6">

                  {/* ATS Score card */}
                  <div className={`p-6 rounded-2xl border ${getScoreBg(activeAnalysis.atsScore)} flex flex-col md:flex-row items-center gap-6`}>
                    <div className="relative w-24 h-24 flex items-center justify-center bg-card/45 rounded-full border border-border shadow-inner">
                      <span className={`text-3xl font-extrabold font-display ${getScoreColor(activeAnalysis.atsScore)}`}>
                        {activeAnalysis.atsScore}
                      </span>
                    </div>
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-base font-extrabold text-foreground">ATS Score Diagnostic</h3>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        {activeAnalysis.atsScore >= 80 ? '🟢 Strong — Your resume is ATS-friendly.' : activeAnalysis.atsScore >= 60 ? '🟡 Average — Improvements needed.' : '🔴 Weak — Significant changes required.'}
                      </p>
                    </div>
                  </div>

                  {/* Keywords & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Missing Keywords */}
                    <div className="p-5 rounded-2xl glass-card border border-border bg-card/25 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-yellow-500" /> Missing Target Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {activeAnalysis.keywords && activeAnalysis.keywords.length > 0 ? (
                          activeAnalysis.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold">
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">None detected or required.</span>
                        )}
                      </div>
                    </div>

                    {/* Format / Improvement list */}
                    <div className="p-5 rounded-2xl glass-card border border-border bg-card/25 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-primary" /> Key Format Improvements
                      </h4>
                      <ul className="space-y-2 text-xs leading-normal">
                        {activeAnalysis.improvements && activeAnalysis.improvements.length > 0 ? (
                          activeAnalysis.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 font-semibold text-foreground/80">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{imp}</span>
                            </li>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">No critical layout gaps found.</span>
                        )}
                      </ul>
                    </div>

                  </div>

                  {/* Detailed Feedback */}
                  {activeAnalysis.feedback && (
                    <div className="p-5 rounded-2xl glass-card border border-border space-y-3">
                      <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" /> AI Detailed Feedback
                      </h4>
                      <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed text-foreground/80 font-medium whitespace-pre-line">
                        <ReactMarkdown>{activeAnalysis.feedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed border-border/60 rounded-2xl">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-muted-foreground">No Resume Analyzed Yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Upload a PDF resume to get your ATS score and AI feedback.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
    </DashboardLayout>
  );
}
