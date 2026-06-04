"use client";

import React, { createContext, useContext, useState } from 'react';

interface TreeInteractionContextType {
  draggingPersonId: string | null;
  setDraggingPersonId: (id: string | null) => void;
  hoveredPersonId: string | null;
  setHoveredPersonId: (id: string | null) => void;
}

const TreeInteractionContext = createContext<TreeInteractionContextType | undefined>(undefined);

export function TreeInteractionProvider({ children }: { children: React.ReactNode }) {
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);

  return (
    <TreeInteractionContext.Provider value={{ 
      draggingPersonId, 
      setDraggingPersonId,
      hoveredPersonId,
      setHoveredPersonId
    }}>
      {children}
    </TreeInteractionContext.Provider>
  );
}

export function useTreeInteraction() {
  const context = useContext(TreeInteractionContext);
  if (!context) throw new Error('useTreeInteraction must be used within TreeInteractionProvider');
  return context;
}
