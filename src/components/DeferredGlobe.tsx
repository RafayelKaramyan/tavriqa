import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { DestinationId } from '../domain/catalog';
const Globe = lazy(() => import('./Globe'));
export default function DeferredGlobe({ selected }: { selected: DestinationId }) {
  const root = useRef<HTMLDivElement>(null),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const placeholder = (
    <div className="globe-loading" role="status">
      <span>Opening the atlas…</span>
    </div>
  );
  return (
    <div ref={root} className="deferred-globe">
      {visible ? (
        <Suspense fallback={placeholder}>
          <Globe selected={selected} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
