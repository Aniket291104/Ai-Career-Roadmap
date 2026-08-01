'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, FileText, Compass, Kanban, MessageSquare, ExternalLink, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [open]);

  const searchItems = [
    { title: 'Frontend Developer Roadmap', desc: 'AI-generated timeline for React, CSS, and HTML.', category: 'roadmaps', url: '/roadmaps', icon: Compass },
    { title: 'Backend Systems Engineering', desc: 'Node.js, databases, and microservices.', category: 'roadmaps', url: '/roadmaps', icon: Compass },
    { title: 'Task: Implement JWT Authentication', desc: 'Active security task in sprint.', category: 'tasks', url: '/tasks', icon: Kanban },
    { title: 'Task: Configure MongoDB schemas', desc: 'Database model definition task.', category: 'tasks', url: '/tasks', icon: Kanban },
    { title: 'Resume Scan Assessment', desc: 'Review resume against ATS scores.', category: 'tools', url: 'https://hireboost1.vercel.app', icon: FileText },
    { title: 'GitHub Portfolio Evaluation', desc: 'Analyze real repositories.', category: 'tools', url: '/portfolio-analyzer', icon: FileText },
    { title: 'Mock Technical Interview Workspace', desc: 'Simulate developer interview quizzes.', category: 'tools', url: '/mock-interview', icon: Sparkles },
    { title: 'AI Career Chatbot Assistant', desc: 'Chat directly with career mentor.', category: 'tools', url: '/chat', icon: MessageSquare },
  ];

  const filtered = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    setOpen(false);
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      router.push(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].url);
      }
    }
  };

  return (
    <>
      {/* Search Input Trigger */}
      <div 
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 w-64 rounded-xl border border-border bg-card/20 hover:bg-muted/30 transition-colors cursor-pointer group"
      >
        <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">Search dashboard...</span>
        <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono border border-border/80 text-muted-foreground">Ctrl K</kbd>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
            >
              {/* Input Header */}
              <div className="flex items-center border-b border-border/40 px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search dashboard, tasks, roadmaps..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-0 outline-none text-foreground text-sm w-full placeholder-muted-foreground focus:ring-0"
                />
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-2">
                {filtered.length > 0 ? (
                  <div className="space-y-1">
                    {filtered.map((item, idx) => {
                      const Icon = item.icon;
                      const active = idx === selectedIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelect(item.url)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`
                            flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
                            ${active 
                              ? 'bg-primary/10 border border-primary/20 text-foreground' 
                              : 'border border-transparent text-muted-foreground hover:text-foreground'}
                          `}
                        >
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${active ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-foreground truncate">{item.title}</h4>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/20">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border/30 bg-muted/20 text-[9px] text-muted-foreground flex justify-between font-bold">
                <span>Use Arrow keys to navigate, Enter to select</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
