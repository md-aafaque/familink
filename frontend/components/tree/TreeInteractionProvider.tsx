"use client";

import React, { createContext, useContext, useState } from 'react';

interface TreeInteractionContextType {
  draggingPersonId: string | null;
  setDraggingPersonId: (id: string | null) => void;
  hoveredPersonId: string | null;
  setHoveredPersonId: (id: string | null) => void;
  dragCoordinates: { x: number; y: number } | null;
  setDragCoordinates: (coords: { x: number; y: number } | null) => void;
  dragStartCoords: { x: number; y: number } | null;
  setDragStartCoords: (coords: { x: number; y: number } | null) => void;
  dragHistory: { x: number; y: number }[];
  setDragHistory: (history: { x: number; y: number }[]) => void;
}

const TreeInteractionContext = createContext<TreeInteractionContextType | undefined>(undefined);

export function TreeInteractionProvider({ children }: { children: React.ReactNode }) {
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  const [dragCoordinates, setDragCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [dragStartCoords, setDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [dragHistory, setDragHistory] = useState<{ x: number; y: number }[]>([]);

  return (
    <TreeInteractionContext.Provider value={{ 
      draggingPersonId, 
      setDraggingPersonId,
      hoveredPersonId,
      setHoveredPersonId,
      dragCoordinates,
      setDragCoordinates,
      dragStartCoords,
      setDragStartCoords,
      dragHistory,
      setDragHistory
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
