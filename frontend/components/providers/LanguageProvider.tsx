"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';
import frMessages from '../../messages/fr.json';
import deMessages from '../../messages/de.json';
import jaMessages from '../../messages/ja.json';

export type Language = 'English (US)' | 'Spanish' | 'French' | 'German' | 'Japanese';

const languageToLocale: Record<Language, string> = {
  'English (US)': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Japanese': 'ja',
};

const localeToLanguage: Record<string, Language> = {
  en: 'English (US)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
};

const allMessages: Record<string, Record<string, any>> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  de: deMessages,
  ja: jaMessages,
};

const STORAGE_KEY = 'app-language';

function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (saved in localeToLanguage) return localeToLanguage[saved];
      if (Object.values(localeToLanguage).includes(saved as Language)) return saved as Language;
    }
  } catch {}
  return 'English (US)';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function deepGet(obj: Record<string, any> | null | undefined, path: string): string | undefined {
  if (!obj) return undefined;
  return path.split('.').reduce<string | undefined>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part];
    return undefined;
  }, obj as any);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English (US)');
  const messages = allMessages[languageToLocale[language]];

  useEffect(() => {
    const saved = readLanguage();
    if (saved !== 'English (US)') {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
    document.documentElement.lang = languageToLocale[language];
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    return deepGet(messages, key) ?? deepGet(enMessages, key) ?? key;
  }, [messages]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
