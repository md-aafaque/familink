"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreeInteraction } from './TreeInteractionProvider';
import { useAppTheme } from '../providers/ThemeProvider';

export default function DragRelationshipIndicator() {
  const { draggingPersonId, dragCoordinates, hoveredPersonId, dragStartCoords, dragHistory } = useTreeInteraction();
  const { theme } = useAppTheme();

  // 1. Hook Declarations (Must stay at the top)
  const lastAngleRef = React.useRef(0);
  
  // Calculate rotation based on history and cache the last valid angle
  const rotation = useMemo(() => {
    if (dragHistory.length < 2) return lastAngleRef.current;
    
    const last = dragHistory[dragHistory.length - 1];
    // Look back for a stable direction
    const prev = dragHistory.length > 5 
      ? dragHistory[dragHistory.length - 5] 
      : dragHistory[0];

    if (prev && (prev.x !== last.x || prev.y !== last.y)) {
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI);
      lastAngleRef.current = angle;
    }

    return lastAngleRef.current;
  }, [dragHistory]);

  // Create a smooth SVG path from the history
  const trailPath = useMemo(() => {
    if (dragHistory.length < 2) return "";
    return dragHistory.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");
  }, [dragHistory]);

  const mainColor = theme.isDark ? "#6366f1" : "#f97316";

  // 2. Conditional Return (After all hooks)
  if (!draggingPersonId || !dragCoordinates || !dragStartCoords) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <svg className="w-full h-full">
        <defs>
          <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.4" />
          </linearGradient>

          <radialGradient id="lockOnGlow">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle Glow Trail */}
        <motion.path
          d={trailPath}
          stroke="url(#trailGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#trailGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Core Subtle Trail */}
        <motion.path
          d={trailPath}
          stroke={mainColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.3}
        />

        <AnimatePresence>
          {hoveredPersonId && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Subtle Lock-on Pulse */}
              <motion.circle
                cx={dragCoordinates.x}
                cy={dragCoordinates.y}
                r={30}
                fill="url(#lockOnGlow)"
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              
              <motion.circle
                cx={dragCoordinates.x}
                cy={dragCoordinates.y}
                r={20}
                fill="none"
                stroke={mainColor}
                strokeWidth="1"
                strokeDasharray="8 4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Starting Point Marker (Small Ring) */}
        <motion.circle
          cx={dragStartCoords.x}
          cy={dragStartCoords.y}
          r={6}
          fill="none"
          stroke={mainColor}
          strokeWidth="1.5"
          opacity={0.4}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />

        {/* Directional Arrow Head Tip */}
        <motion.g
          animate={{ 
            x: dragCoordinates.x, 
            y: dragCoordinates.y,
            // If rotation is null (no movement), Framer Motion keeps the last value
            ...(rotation !== null ? { rotate: rotation } : {})
          }}
          transition={{
            x: { type: "tween", ease: "linear", duration: 0 },
            y: { type: "tween", ease: "linear", duration: 0 },
            // x: { type: "spring", stiffness: 1000, damping: 30, mass: 0.1 },
            // y: { type: "spring", stiffness: 1000, damping: 30, mass: 0.1 },
            rotate: { type: "spring", stiffness: 200, damping: 25 }
          }}
          filter="url(#trailGlow)"
        >
          {/* Subtle Pointy Arrow Head */}
          <path d="M 10 0 L -6 -6 L -3 0 L -6 6 Z" fill={mainColor} opacity={0.8} />
          
          {/* Smaller Pulsing Core */}
          <motion.circle
            r={1.5}
            fill="white"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
