"use client";

import { useState, useEffect } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

const QUERIES: Record<Breakpoint, string> = {
  desktop: "(min-width: 1024px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  mobile: "(max-width: 767px)",
};

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    const mqls = Object.entries(QUERIES).map(([key, q]) => {
      const mql = matchMedia(q);
      const handler = () => {
        if (mql.matches) setBreakpoint(key as Breakpoint);
      };
      mql.addEventListener("change", handler);
      if (mql.matches) setBreakpoint(key as Breakpoint);
      return [mql, handler] as const;
    });
    return () => {
      mqls.forEach(([mql, handler]) => mql.removeEventListener("change", handler));
    };
  }, []);

  return breakpoint;
}

export function useIsMobile(): boolean {
  return useBreakpoint() === "mobile";
}
