'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn, ZoomOut, Maximize2, Compass, Award, Sparkles, BookOpen,
  AlertCircle, Play, Loader2, Link as LinkIcon, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface RoadmapTopic {
  title: string;
  description?: string;
  completedTasks?: number;
  totalTasks?: number;
}

interface RoadmapWeek {
  weekNumber: number;
  topics: RoadmapTopic[];
}

interface SkillNode {
  id: string;
  name: string;
  category: string;
  progress: number;
  weekNumber: number;
  x: number;
  y: number;
  locked: boolean;
}

export default function SkillTreePage() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);
  const [roadmapTitle, setRoadmapTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRoadmap, setHasRoadmap] = useState(false);

  useEffect(() => {
    const fetchActiveRoadmap = async () => {
      setLoading(true);
      try {
        const res = await api.get('/roadmaps/active');
        const roadmap = res.data?.roadmap;

        if (!roadmap || !roadmap.weeks || roadmap.weeks.length === 0) {
          setHasRoadmap(false);
          return;
        }

        setHasRoadmap(true);
        setRoadmapTitle(roadmap.title);

        // Build nodes from roadmap weeks & topics
        const builtNodes: SkillNode[] = [];
        const builtConnections: { from: string; to: string }[] = [];

        const colWidth = 200;
        const rowHeight = 100;
        let prevRowLastId: string | null = null;

        roadmap.weeks.forEach((week: RoadmapWeek, wIdx: number) => {
          const weekTopics = week.topics || [];
          weekTopics.forEach((topic: RoadmapTopic, tIdx: number) => {
            const id = `w${week.weekNumber}-t${tIdx}`;
            const total = topic.totalTasks ?? 0;
            const done = topic.completedTasks ?? 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            const locked = wIdx > 0 && progress === 0;

            builtNodes.push({
              id,
              name: topic.title,
              category: `Week ${week.weekNumber}`,
              progress,
              weekNumber: week.weekNumber,
              x: wIdx * colWidth + 40,
              y: tIdx * rowHeight + 40,
              locked,
            });

            // Connect to prev topic in same week
            if (tIdx > 0) {
              builtConnections.push({ from: `w${week.weekNumber}-t${tIdx - 1}`, to: id });
            }
            // Connect first topic of this week to last topic of prev week
            if (tIdx === 0 && prevRowLastId) {
              builtConnections.push({ from: prevRowLastId, to: id });
            }
          });

          // Track last node of this week for next week connection
          if (weekTopics.length > 0) {
            prevRowLastId = `w${week.weekNumber}-t${weekTopics.length - 1}`;
          }
        });

        setNodes(builtNodes);
        setConnections(builtConnections);
      } catch (err) {
        setHasRoadmap(false);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRoadmap();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (type: 'in' | 'out') => {
    setZoom((prev) => {
      const next = type === 'in' ? prev + 0.15 : prev - 0.15;
      return Math.max(0.5, Math.min(next, 2));
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 50, y: 50 });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Banner */}
        <div className="p-5 rounded-2xl glass-card flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-transparent">
          <div>
            <h3 className="text-lg font-bold">
              {roadmapTitle ? `Skill Tree — ${roadmapTitle}` : 'Skill Tree'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasRoadmap
                ? 'Your roadmap topics mapped as a visual skill tree. Progress updates as you complete tasks.'
                : 'Generate an AI roadmap to see your personalized skill tree.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleZoom('in')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom('out')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleReset} className="p-2 rounded-xl bg-card border border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer" title="Reset View">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground animate-pulse">Loading your skill tree...</span>
          </div>
        ) : !hasRoadmap ? (
          <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl space-y-4">
            <Compass className="w-12 h-12 text-muted-foreground/30 mx-auto animate-spin-slow" />
            <h4 className="font-bold text-sm">No Active Roadmap</h4>
            <p className="text-xs text-muted-foreground">Generate an AI roadmap first to see your personalized skill tree with real topics and progress.</p>
            <Link href="/roadmaps" className="inline-flex items-center gap-1.5 text-primary text-xs font-bold hover:underline">
              <Sparkles className="w-4 h-4" />
              <span>Generate My Roadmap</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main SVG Skill Map Area */}
            <div
              className="lg:col-span-2 relative overflow-hidden h-[350px] sm:h-[420px] lg:h-[500px] border border-border/50 rounded-3xl bg-grid-mesh bg-card/5 select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="absolute inset-0 transition-transform duration-75 origin-top-left"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                {/* SVG connection lines */}
                <svg className="absolute inset-0 pointer-events-none w-[2000px] h-[1200px]">
                  <defs>
                    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  {connections.map((conn, idx) => {
                    const fromNode = nodes.find((n) => n.id === conn.from);
                    const toNode = nodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <line
                        key={idx}
                        x1={fromNode.x + 80} y1={fromNode.y + 25}
                        x2={toNode.x + 80} y2={toNode.y + 25}
                        stroke={toNode.locked ? 'rgba(255,255,255,0.08)' : 'url(#line-grad)'}
                        strokeWidth={toNode.locked ? 1.5 : 2.5}
                        strokeDasharray={toNode.locked ? '5,5' : '0'}
                      />
                    );
                  })}
                </svg>

                {/* Node cards */}
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <motion.div
                      key={node.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                      className={`
                        absolute w-44 p-3 rounded-2xl border transition-all cursor-pointer text-center select-none shadow-md backdrop-blur-md
                        ${node.locked
                          ? 'border-border/30 bg-card/25 text-muted-foreground/50'
                          : isSelected
                            ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30'
                            : 'border-border bg-card/65 text-foreground hover:border-primary/50'}
                      `}
                      style={{ left: node.x, top: node.y }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${node.locked ? 'bg-muted text-muted-foreground/60' : 'bg-primary/20 text-primary'}`}>
                          {node.category}
                        </span>
                        {node.locked && <span className="text-[10px]">🔒</span>}
                      </div>
                      <h4 className="text-xs font-bold truncate">{node.name}</h4>

                      {!node.locked && (
                        <div className="mt-2.5 space-y-1">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${node.progress}%` }} />
                          </div>
                          <span className="text-[8px] text-muted-foreground font-extrabold">{node.progress}% complete</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="absolute bottom-4 left-4 p-2 bg-black/60 border border-border/40 rounded-xl text-[9px] font-extrabold text-muted-foreground flex items-center gap-1.5 select-none pointer-events-none">
                <span>Drag to Pan • Zoom with buttons</span>
              </div>
            </div>

            {/* Node details sidebar */}
            <div className="p-6 rounded-3xl glass-card flex flex-col justify-between min-h-[300px] lg:min-h-[400px]">
              {selectedNode ? (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">{selectedNode.category}</span>
                    <h3 className="text-xl font-bold mt-1">{selectedNode.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {selectedNode.locked
                        ? 'This topic is locked. Complete earlier weeks to unlock it.'
                        : `Progress: ${selectedNode.progress}% of tasks completed.`}
                    </p>
                  </div>

                  {!selectedNode.locked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Completion</span>
                        <span>{selectedNode.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${selectedNode.progress}%` }} />
                      </div>
                    </div>
                  )}

                  <Link
                    href="/tasks"
                    className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>{selectedNode.locked ? 'View All Tasks' : 'Continue Tasks'}</span>
                  </Link>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-3 py-16">
                  <Compass className="w-10 h-10 text-muted-foreground/30 animate-spin-slow" />
                  <span>Click any node on the Skill Map to view progress and tasks.</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
