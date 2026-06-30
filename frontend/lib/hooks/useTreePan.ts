"use client";

import { useCallback } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

export function useTreePan(transformRef: React.RefObject<ReactZoomPanPinchRef | null>) {
  const panBy = useCallback((dx: number, dy: number) => {
    const ref = transformRef.current;
    if (!ref) return;
    const { positionX = 0, positionY = 0, scale = 1 } = ref.instance.state;
    ref.setTransform(positionX + dx, positionY + dy, scale, 200);
  }, [transformRef]);

  return { panBy };
}
