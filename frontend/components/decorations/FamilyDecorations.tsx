"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

function Leaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <path d="M12 2C12 2 6 8 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 8 12 2 12 2Z" />
    </svg>
  );
}

function ConnectionNode({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn("pointer-events-none", className)}
      style={style}
    >
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="8" strokeDasharray="2 2" />
    </svg>
  );
}

function BranchLine({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 60 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={cn("pointer-events-none", className)}
      style={style}
    >
      <path d="M5 15H30M30 15L40 5M30 15L40 25" strokeDasharray="2 2" />
    </svg>
  );
}

function Flower({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("pointer-events-none animate-float-slow", className)}
      style={style}
    >
      <g>
        <ellipse cx="12" cy="7" rx="4" ry="5" />
        <ellipse cx="12" cy="7" rx="4" ry="5" transform="rotate(72, 12, 12)" />
        <ellipse cx="12" cy="7" rx="4" ry="5" transform="rotate(144, 12, 12)" />
        <ellipse cx="12" cy="7" rx="4" ry="5" transform="rotate(216, 12, 12)" />
        <ellipse cx="12" cy="7" rx="4" ry="5" transform="rotate(288, 12, 12)" />
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  );
}

function Berry({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("pointer-events-none", className)}
      style={style}
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="6" cy="5.5" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

const leafColors = [
  "text-emerald-400/17 dark:text-emerald-400/12",
  "text-orange-400/17 dark:text-orange-400/12",
  "text-yellow-400/17 dark:text-yellow-400/12",
] as const;

function generateLeaves(count: number, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * 0.6;
    const y = 7.5 + row * cellH + Math.random() * cellH * 0.6;
    const size = Math.floor((Math.random() * 5 + 4) * scale);
    const delay = (Math.random() * 5).toFixed(2);
    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    result.push({ x: x.toFixed(1) + "%", y: y.toFixed(1) + "%", size, delay: delay + "s", color });
  }
  return result;
}

export function Leaves({ className, scale = 1 }: { className?: string; scale?: number }) {
  const items = useMemo(() => generateLeaves(12, scale), [scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {items.map((leaf, i) => (
        <Leaf
          key={i}
          className={cn("absolute", leaf.color)}
          style={{ left: leaf.x, top: leaf.y, width: leaf.size * 7, height: leaf.size * 7, animationDelay: leaf.delay }}
        />
      ))}
    </div>
  );
}

const nodeColors = [
  "text-orange-400/17 dark:text-orange-400/12",
  "text-pink-400/17 dark:text-pink-400/12",
  "text-emerald-400/17 dark:text-emerald-400/12",
] as const;

function generateNodes(count: number, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * 0.6;
    const y = 7.5 + row * cellH + Math.random() * cellH * 0.6;
    const size = Math.floor((Math.random() * 5 + 4) * scale);
    const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
    result.push({ x: x.toFixed(1) + "%", y: y.toFixed(1) + "%", size, color });
  }
  return result;
}

export function ConnectionNodes({ className, scale = 1 }: { className?: string; scale?: number }) {
  const items = useMemo(() => generateNodes(16, scale), [scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {items.map((node, i) => (
        <ConnectionNode
          key={i}
          className={cn("absolute", node.color)}
          style={{
            left: node.x,
            top: node.y,
            width: node.size * 4,
            height: node.size * 4,
          }}
        />
      ))}
    </div>
  );
}

const branchColors = [
  "text-orange-400/14 dark:text-orange-400/9",
  "text-emerald-400/14 dark:text-emerald-400/9",
] as const;

function generateBranches(count: number, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * 0.6;
    const y = 7.5 + row * cellH + Math.random() * cellH * 0.6;
    const baseScale = Math.floor(Math.random() * 54 + 72);
    const rotation = Math.floor(Math.random() * 360);
    const color = branchColors[Math.floor(Math.random() * branchColors.length)];
    result.push({
      x: x.toFixed(1) + "%",
      y: y.toFixed(1) + "%",
      scale: Math.floor(baseScale * scale),
      rotation,
      color,
    });
  }
  return result;
}

export function BranchDecorations({ className, scale = 1 }: { className?: string; scale?: number }) {
  const items = useMemo(() => generateBranches(8, scale), [scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {items.map((branch, i) => (
        <BranchLine
          key={i}
          className={cn("absolute", branch.color)}
          style={{
            left: branch.x,
            top: branch.y,
            width: branch.scale,
            height: branch.scale / 2,
            transform: `rotate(${branch.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

const flowerColors = [
  "text-pink-400/17 dark:text-pink-400/12",
  "text-yellow-400/17 dark:text-yellow-400/12",
  "text-orange-400/17 dark:text-orange-400/12",
] as const;

function generateFlowers(count: number, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * 0.6;
    const y = 7.5 + row * cellH + Math.random() * cellH * 0.6;
    const size = Math.floor((Math.random() * 8 + 5) * scale);
    const delay = (Math.random() * 5).toFixed(2);
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    result.push({ x: x.toFixed(1) + "%", y: y.toFixed(1) + "%", size, delay: delay + "s", color });
  }
  return result;
}

export function Flowers({ className, scale = 1 }: { className?: string; scale?: number }) {
  const items = useMemo(() => generateFlowers(12, scale), [scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {items.map((f, i) => (
        <Flower
          key={i}
          className={cn("absolute", f.color)}
          style={{ left: f.x, top: f.y, width: f.size * 2, height: f.size * 2, animationDelay: f.delay }}
        />
      ))}
    </div>
  );
}

const berryColors = [
  "text-red-400/14 dark:text-red-400/9",
  "text-orange-400/14 dark:text-orange-400/9",
  "text-pink-400/14 dark:text-pink-400/9",
] as const;

function generateBerries(count: number, scale = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const result = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 85 / cols;
    const cellH = 85 / rows;
    const x = 7.5 + col * cellW + Math.random() * cellW * 0.6;
    const y = 7.5 + row * cellH + Math.random() * cellH * 0.6;
    const size = Math.floor((Math.random() * 4 + 2) * scale);
    const color = berryColors[Math.floor(Math.random() * berryColors.length)];
    result.push({ x: x.toFixed(1) + "%", y: y.toFixed(1) + "%", size, color });
  }
  return result;
}

export function Berries({ className, scale = 1 }: { className?: string; scale?: number }) {
  const items = useMemo(() => generateBerries(16, scale), [scale]);
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden hidden md:block", className)}>
      {items.map((b, i) => (
        <Berry
          key={i}
          className={cn("absolute", b.color)}
          style={{ left: b.x, top: b.y, width: b.size * 2, height: b.size * 2 }}
        />
      ))}
    </div>
  );
}
