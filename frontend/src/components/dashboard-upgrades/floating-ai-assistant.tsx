'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Mic, MicOff, Maximize2, Minimize2, Sparkles, BookOpen, AlertCircle, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Logo } from '@/components/logo';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello Aniket! I am your AI Career Co-pilot. How can I help you accelerate your tech journey today?',
      timestamp: new Date(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech Recognition Hookup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = 'en-US';

          rec.onresult = (event: any) => {
            const text = event.results[0][0]?.transcript || '';
            setInput((prev) => (prev ? prev + ' ' + text : text));
            setIsListening(false);
          };

          rec.onerror = () => {
            setIsListening(false);
            toast.error('Voice input encountered an error. Please try again.');
          };

          rec.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = rec;
        } catch (e) {
          setSpeechSupported(false);
        }
      }
    }
  }, []);

  const startVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
        toast.error('Could not activate microphone.');
      }
    }
  };

  const quickActions = [
    { label: 'Explain this topic', prompt: 'Can you explain the difference between REST and gRPC with examples?' },
    { label: 'Generate Quiz', prompt: 'Create a 5-question TypeScript multiple-choice quiz.' },
    { label: 'Review Resume', url: 'https://hireboost1.vercel.app' },
    { label: 'Debug Code', prompt: 'Why does my React useEffect run twice, and how do I clean up subscriptions?' },
    { label: 'Career Advice', prompt: 'What is the optimal roadmap to transition from Frontend to AI Engineering?' },
    { label: 'Generate Project', prompt: 'Suggest 3 unique portfolio projects using Next.js and MongoDB.' },
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Direct integration with backend chatbot API
      const res = await api.post('/chats', { message: textToSend });
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: res.data.reply || 'I processed your query. Keep building!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Mock streaming fallback for offline mode or network errors
      setTimeout(() => {
        const hasSentFirstQuiz = messages.some(msg => 
          msg.sender === 'assistant' && msg.text.includes('type of "null" in JavaScript')
        );

        const quiz1 = `Sure! Here is a 5-question TypeScript multiple-choice quiz:

1. What is the type of "null" in JavaScript?
   A. null
   B. object
   C. undefined
   D. string
   (Correct Answer: B. object)

2. Which keyword is used to declare a block-scoped variable that cannot be reassigned?
   A. var
   B. let
   C. const
   D. define
   (Correct Answer: C. const)

3. How do you specify that a variable 'x' can be either a string or a number in TypeScript?
   A. let x: string & number;
   B. let x: string | number;
   C. let x: string || number;
   D. let x: string && number;
   (Correct Answer: B. string | number)

4. What is the default access modifier for class members in TypeScript if not specified?
   A. private
   B. protected
   C. public
   D. internal
   (Correct Answer: C. public)

5. Which file is used to configure compilation settings for a TypeScript project?
   A. package.json
   B. tsconfig.json
   C. webpack.config.js
   D. tsconfig.js
   (Correct Answer: B. tsconfig.json)`;

        const quiz2 = `Sure! Here is another 5-question TypeScript multiple-choice quiz:

1. Which of the following is NOT a primitive type in TypeScript?
   A. string
   B. boolean
   C. tuple
   D. number
   (Correct Answer: C. tuple)

2. What does the "readonly" modifier do in TypeScript?
   A. Prevents writing to properties outside the constructor
   B. Makes properties write-only
   C. Speeds up webpack compilation
   D. Restricts variables from being referenced
   (Correct Answer: A. Prevents writing to properties outside the constructor)

3. What is the purpose of the "any" type in TypeScript?
   A. It forces strict compilation checks
   B. It disables type-checking for the variable
   C. It represents a string format only
   D. It allows variables to be only null
   (Correct Answer: B. It disables type-checking for the variable)

4. Which utility type constructs a type with all properties of Type set to optional?
   A. Required<Type>
   B. Pick<Type, Keys>
   C. Record<Keys, Type>
   D. Partial<Type>
   (Correct Answer: D. Partial<Type>)

5. How do you write a type assertion in TypeScript?
   A. let x = y as string;
   B. let x = cast<string>(y);
   C. let x = (string)y;
   D. let x = y: string;
   (Correct Answer: A. let x = y as string;)`;

        const responses: Record<string, string> = {
          'explain': 'REST APIs communicate synchronously over HTTP/1.1 using HTTP methods, whereas gRPC uses HTTP/2 with Protocol Buffers for high-performance, duplex, binary communication.',
          'quiz': hasSentFirstQuiz ? quiz2 : quiz1,
          'resume': '1. Use clear headings (Skills, Experience, Projects).\n2. Write statements in Action-Result format.\n3. Integrate keywords like "TypeScript", "REST APIs", and "CI/CD".',
        };

        const key = Object.keys(responses).find((k) => textToSend.toLowerCase().includes(k)) || 'default';
        const fallbackText = key !== 'default' 
          ? responses[key] 
          : `That is a great technical question! Here is an AI suggestion for "${textToSend}": Focus on mastering core system principles, write test files, and deploy projects on cloud platforms to demonstrate skill.`;

        const botMsg: Message = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* GLOWING FLOATING AI BUTTON */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-lg shadow-primary/30 relative focus:outline-none focus:ring-4 focus:ring-primary/20 cursor-pointer"
            id="floating-ai-btn"
          >
            {/* Animated Pulsing Ring */}
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75 pointer-events-none" />

            <Logo className="w-7 h-7" />
            
            {/* Notification Badge */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* EXPANDABLE CHAT DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            drag={!isFullscreen} // Draggable when not fullscreen
            dragMomentum={false}
            dragConstraints={{ top: 0, bottom: 600, left: -1000, right: 0 }}
            className={`
              rounded-2xl bg-card shadow-2xl border border-border overflow-hidden flex flex-col z-50
              ${isFullscreen 
                ? 'fixed inset-4 w-auto h-auto' 
                : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] max-h-[85vh]'}
            `}
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/45 select-none cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-bold tracking-wide">AI Career Mentor</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/25">
              {messages.map((msg) => {
                const isBot = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm
                        ${isBot 
                          ? 'bg-card border border-border/40 text-foreground' 
                          : 'bg-primary text-white'}
                      `}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/40 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions (Rendered when text field is empty) */}
            {input.length === 0 && (
              <div className="p-3 border-t border-border/30 bg-muted/10">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 block">Quick Actions</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (action.url) {
                          window.open(action.url, '_blank');
                        } else if (action.prompt) {
                          handleSendMessage(action.prompt);
                        }
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-all flex items-center gap-1 text-muted-foreground hover:text-primary"
                    >
                      <span>{action.label}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 border-t border-border/40 bg-card/45 flex items-center gap-2">
              {/* Voice button */}
              <button
                onClick={startVoiceInput}
                className={`
                  p-2 rounded-xl border transition-colors focus:outline-none
                  ${isListening 
                    ? 'bg-red-500/20 border-red-500/40 text-red-500 animate-pulse' 
                    : 'bg-card border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground'}
                `}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Message AI..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                className="flex-1 bg-background border border-border/60 rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40 placeholder-muted-foreground"
                disabled={isListening}
              />

              <button
                onClick={() => handleSendMessage(input)}
                className="p-2 rounded-xl bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
