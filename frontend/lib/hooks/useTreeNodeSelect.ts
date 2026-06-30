"use client";

import { useState, useCallback } from "react";

export function useTreeNodeSelect() {
  const [focusId, setFocusId] = useState<string | null>(null);

  const selectNode = useCallback((id: string | null) => {
    setFocusId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setFocusId(null);
  }, []);

  return { focusId, selectNode, clearSelection };
}
