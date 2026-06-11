"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppTheme } from "@/components/providers/ThemeProvider";

interface CustomSelectProps {
  options: { label: string; value: string }[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  disabled,
  size = 'md'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = value ? options.find((opt) => opt.value === value) : undefined;

  const sizeClasses = {
    sm: "h-9 px-3 py-1.5 text-xs rounded-lg",
    md: "h-11 px-4 py-2.5 text-sm rounded-xl",
    lg: "h-14 px-6 py-4 text-base rounded-2xl"
  };

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.98 }}
          style={{
            position: 'absolute',
            top: coords.top + 4,
            left: coords.left,
            width: coords.width,
            zIndex: 9999
          }}
          className={cn(
            "rounded-xl border shadow-2xl overflow-hidden py-1.5 transition-colors",
            theme.colors.surface,
            theme.colors.border
          )}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className={cn("px-4 py-3 text-xs italic", theme.colors.textMuted)}>No options available</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-all flex items-center justify-between group",
                    value === option.value 
                      ? cn("bg-primary/10 font-bold", theme.colors.accent)
                      : cn("hover:bg-black/5 dark:hover:bg-white/5", theme.colors.text)
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between font-bold border outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          theme.colors.bg,
          theme.colors.border,
          theme.colors.text,
          isOpen ? "ring-2 ring-primary/20 border-primary" : "hover:border-primary/50"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </button>

      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
}
