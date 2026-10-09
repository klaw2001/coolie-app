import { useEffect } from 'react';

import { useApp } from '@/store/useApp';

/** Drives dummy coolies, trip progress and incoming requests once a second. */
export function useSimulation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => useApp.getState().tick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
}
