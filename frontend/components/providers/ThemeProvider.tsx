"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppThemeType = 'light' | 'dark';

interface AppTheme {
  name: string;
  isDark: boolean;
  colors: {
    borderAccent: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryMuted: string;
    accent: string;
    hover: string;
    sidebar: {
      bg: string;
      border: string;
      itemHover: string;
      activeText: string;
      hoverText: string;
    };
    header: {
      bg: string;
      border: string;
    };
    tree: {
      canvas: string;
      grid: string;
      lines: string;
    }
  }
}

const themes: Record<AppThemeType, AppTheme> = {
  light: {
    name: 'Light',
    isDark: false,
    colors: {
      bg: 'bg-white',
      surface: 'bg-white',
      border: 'border-slate-200',
      borderAccent: 'border-orange-500',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      primary: 'bg-orange-600',
      primaryMuted: 'bg-orange-50',
      accent: 'text-orange-600',
      hover: 'hover:bg-orange-100',
      sidebar: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        itemHover: 'hover:bg-slate-200/50',
        activeText: 'text-orange-600',
        hoverText: 'hover:text-slate-900',
      },
      header: {
        bg: 'bg-white/80',
        border: 'border-slate-200',
      },
      tree: {
        canvas: '#ffffff',
        grid: '#f1f5f9',
        lines: '#e2e8f0',
      }
    }
  },
  dark: {
    name: 'Dark',
    isDark: true,
    colors: {
      bg: 'bg-slate-950',
      surface: 'bg-slate-900',
      border: 'border-slate-800',
      borderAccent: 'border-indigo-500',
      text: 'text-slate-100',
      textMuted: 'text-slate-400',
      primary: 'bg-indigo-500',
      primaryMuted: 'bg-indigo-900/30',
      accent: 'text-indigo-400',
      hover: 'hover:bg-white/5',
      sidebar: {
        bg: 'bg-slate-900',
        border: 'border-slate-800',
        itemHover: 'hover:bg-slate-800',
        activeText: 'text-indigo-400',
        hoverText: 'hover:text-slate-100',
      },
      header: {
        bg: 'bg-slate-950/80',
        border: 'border-slate-800',
      },
      tree: {
        canvas: '#020617',
        grid: '#1e293b',
        lines: '#334155',
      }
    }
  }
};

interface ThemeContextType {
  theme: AppTheme;
  themeType: AppThemeType;
  setTheme: (type: AppThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeType, setThemeType] = useState<AppThemeType>('light');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as AppThemeType || 'light';
    setThemeType(saved);
    if (themes[saved].isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = (type: AppThemeType) => {
    setThemeType(type);
    localStorage.setItem('app-theme', type);
    if (themes[type].isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[themeType], themeType, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
}
