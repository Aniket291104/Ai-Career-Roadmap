import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ className = 'w-9 h-9', iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${iconClassName || ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Premium Border Frame */}
      <polygon
        points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
        stroke="url(#logo-grad)"
        strokeWidth="3.5"
        fill="rgba(139, 92, 246, 0.05)"
        strokeLinejoin="round"
      />

      {/* Trajectory Ascent Curves */}
      <path
        d="M25,75 C35,65 35,45 50,45 C65,45 65,30 75,20"
        stroke="url(#logo-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      <path
        d="M25,75 C35,65 35,45 50,45 C65,45 65,30 75,20"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Learning Milestone Nodes */}
      <circle cx="35" cy="62" r="3.5" fill="white" />
      <circle cx="50" cy="45" r="4.5" fill="#ec4899" stroke="white" strokeWidth="1.5" />
      <circle cx="62" cy="33" r="3.5" fill="white" />

      {/* Target Achievement Star */}
      <path
        d="M75,10 L77.5,15.5 L83.5,16 L79,20 L80.5,26 L75,22.5 L69.5,26 L71,20 L66.5,16 L72.5,15.5 Z"
        fill="url(#star-grad)"
        filter="url(#glow)"
      />
    </svg>
  );
}

export function BrandLogo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <div className={`flex items-center gap-3.5 ${className || ''}`}>
      <Logo className="w-9 h-9" iconClassName={iconClassName} />
      <div className="flex flex-col">
        <span className={`font-extrabold text-base tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent ${textClassName || ''}`}>
          Roadmap<span className="text-primary font-black">AI</span>
        </span>
        <span className="text-[9px] font-extrabold tracking-[0.16em] text-muted-foreground/75 uppercase mt-0.5 leading-none">
          Career Architect
        </span>
      </div>
    </div>
  );
}
