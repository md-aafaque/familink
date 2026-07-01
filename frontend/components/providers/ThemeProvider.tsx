"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import GlobalBackground from '../shared/GlobalBackground';

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
      bg: 'bg-[#FFFDF5]',
      surface: 'bg-[#FFFDF5]',
      border: 'border-[#E2E8F0]',
      borderAccent: 'border-[#F97316]',
      text: 'text-[#1E293B]',
      textMuted: 'text-[#64748B]',
      primary: 'bg-[#F97316]',
      primaryMuted: 'bg-[#F97316]/10',
      accent: 'text-[#F97316]',
      hover: 'hover:bg-[#F97316]/10',
      sidebar: {
        bg: 'bg-[#FFFDF5]',
        border: 'border-[#E2E8F0]',
        itemHover: 'hover:bg-[#F97316]/5',
        activeText: 'text-[#F97316]',
        hoverText: 'hover:text-[#1E293B]',
      },
      header: {
        bg: 'bg-[#FFFDF5]/80',
        border: 'border-[#E2E8F0]',
      },
      tree: {
        canvas: '#FFFDF5',
        grid: '#F1F5F9',
        lines: '#E2E8F0',
      }
    }
  },
  dark: {
    name: 'Dark',
    isDark: true,
    colors: {
      bg: 'bg-[#0F172A]',
      surface: 'bg-[#1E293B]',
      border: 'border-[#334155]',
      borderAccent: 'border-[#FB923C]',
      text: 'text-[#F1F5F9]',
      textMuted: 'text-[#94A3B8]',
      primary: 'bg-[#FB923C]',
      primaryMuted: 'bg-[#FB923C]/15',
      accent: 'text-[#FB923C]',
      hover: 'hover:bg-[#FB923C]/10',
      sidebar: {
        bg: 'bg-[#1E293B]',
        border: 'border-[#334155]',
        itemHover: 'hover:bg-[#334155]',
        activeText: 'text-[#FB923C]',
        hoverText: 'hover:text-[#F1F5F9]',
      },
      header: {
        bg: 'bg-[#0F172A]/80',
        border: 'border-[#334155]',
      },
      tree: {
        canvas: '#0F172A',
        grid: '#1E293B',
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
      <GlobalBackground />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
}
