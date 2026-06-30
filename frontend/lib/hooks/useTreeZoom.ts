"use client";

import { useCallback } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

export function useTreeZoom(transformRef: React.RefObject<ReactZoomPanPinchRef | null>) {
  const zoomIn = useCallback((step = 0.2) => {
    transformRef.current?.zoomIn(step);
  }, [transformRef]);

  const zoomOut = useCallback((step = 0.2) => {
    transformRef.current?.zoomOut(step);
  }, [transformRef]);

  const fitView = useCallback(() => {
    transformRef.current?.resetTransform();
  }, [transformRef]);

  return { zoomIn, zoomOut, fitView };
}
