"use client";

import { useAppTheme } from "../providers/ThemeProvider";
import { Heart, ArrowDown, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface RelationshipMarkerProps {
  type: 'parent' | 'spouse' | 'sibling' | 'junction';
  direction?: 'horizontal' | 'vertical';
  length?: string;
  className?: string;
  color?: string;
}

export default function RelationshipMarker({ type, direction = 'vertical', length = '32px', className, color }: RelationshipMarkerProps) {
  const { theme } = useAppTheme();
  const strokeColor = color || theme.colors.tree.lines;

  if (type === 'spouse') {
    return (
      <div className={cn("relative flex items-center justify-center", className)} style={{ [direction === 'horizontal' ? 'width' : 'height']: length }}>
        <svg
          width={direction === 'horizontal' ? length : '4'}
          height={direction === 'horizontal' ? '4' : length}
          className="overflow-visible"
        >
          <path
            d={direction === 'horizontal' ? `M 0 2 L ${length} 2` : `M 2 0 L 2 ${length}`}
            stroke={strokeColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-40"
          />
          <path
            d={direction === 'horizontal' ? `M 0 2 L ${length} 2` : `M 2 0 L 2 ${length}`}
            stroke="url(#spouse-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spouse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (type === 'parent') {
    return (
      <div className={cn("relative flex flex-col items-center", className)} style={{ height: length }}>
        <svg width="4" height={length} className="overflow-visible">
          <path
            d={`M 2 0 L 2 ${length}`}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (type === 'sibling') {
    return (
      <div className={cn("relative flex items-center justify-center", className)} style={{ width: length }}>
        <svg width={length} height="4" className="overflow-visible">
          <path
            d={`M 0 2 L ${length} 2`}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (type === 'junction') {
    return (
      <div className={cn("w-4 h-4 rounded-full border-2 shadow-xl z-10 flex items-center justify-center", theme.colors.surface, theme.colors.border)}>
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>
    );
  }

  return null;
}
