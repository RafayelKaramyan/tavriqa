import { useState, useSyncExternalStore, useEffect, type ReactNode } from 'react';
import { MotionContext } from './useMotion';
function subscribeMedia(listener: () => void) {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useSyncExternalStore(
    subscribeMedia,
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  const [paused, setPaused] = useState(false),
    reduced = systemReduced || paused;
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);
  return (
    <MotionContext value={{ reduced, systemReduced, toggle: () => setPaused((v) => !v) }}>
      {children}
    </MotionContext>
  );
}
