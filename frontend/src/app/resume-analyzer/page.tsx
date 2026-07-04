'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
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
                ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 hover:border-primary/40 hover:bg-muted/10'}
                ${selectedFile ? 'border-green-500/50 bg-green-500/5' : ''}
              `}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              {selectedFile ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="text-sm font-bold text-foreground text-center truncate w-full px-4">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-muted-foreground text-center">Drag & Drop your PDF here<br /><span className="text-[10px]">or click to browse files</span></p>
                </>
              )}
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || uploading}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing with Gemini AI...</span></>
              ) : (
                <><Sparkles className="w-4 h-4" /><span>Analyze Resume</span></>
              )}
            </button>

            {/* History List */}
            {history.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider px-1">Previous Analyses</p>
                {history.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => setActiveAnalysis(h)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                      activeAnalysis?._id === h._id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate flex-1">{h.fileName || 'Resume'}</span>
                      <span className={`font-extrabold ml-2 ${getScoreColor(h.atsScore)}`}>{h.atsScore}%</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Analysis Results */}
          <div className="lg:col-span-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-bold text-muted-foreground">Loading analysis history...</span>
              </div>
            ) : activeAnalysis ? (
              <div className="space-y-5">

                {/* ATS Score Card */}
                <div className={`p-6 rounded-2xl border flex items-center justify-between ${getScoreBg(activeAnalysis.atsScore)}`}>
                  <div>
                    <p className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest">ATS Compatibility Score</p>
                    <div className={`text-5xl font-extrabold mt-1 ${getScoreColor(activeAnalysis.atsScore)}`}>
                      {activeAnalysis.atsScore}<span className="text-xl text-muted-foreground/50">/100</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold">
                      {activeAnalysis.atsScore >= 80 ? '🟢 Strong — Your resume is ATS-friendly.' : activeAnalysis.atsScore >= 60 ? '🟡 Average — Improvements needed.' : '🔴 Weak — Significant changes required.'}
                    </p>
                  </div>
                  <BarChart2 className={`w-16 h-16 opacity-20 ${getScoreColor(activeAnalysis.atsScore)}`} />
                </div>

                {/* Keywords */}
                {activeAnalysis.keywords?.length > 0 && (
                  <div className="p-5 rounded-2xl glass-card border border-border space-y-3">
                    <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Detected Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeAnalysis.keywords.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {activeAnalysis.improvements?.length > 0 && (
                  <div className="p-5 rounded-2xl glass-card border border-border space-y-3">
                    <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-yellow-500" /> Suggested Improvements
                    </h4>
                    <ul className="space-y-2">
                      {activeAnalysis.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-semibold text-muted-foreground">
                          <span className="text-yellow-500 mt-0.5 shrink-0">→</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
