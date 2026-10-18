import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { ArrowLeft, ArrowRight, MoveUpRight } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { geography } from '../data/geography';
import { destinations, destinationById, type DestinationId } from '../domain/catalog';
import { useMotion } from './useMotion';
const ThreeGlobe = lazy(() => import('./ThreeGlobe'));
class GlobeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function webglSupported() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
export function FlatGlobe({
  longitude,
  latitude,
  selected,
}: {
  longitude: number;
  latitude: number;
  selected: DestinationId;
}) {
  const { reduced } = useMotion(),
    [position, setPosition] = useState([longitude, latitude]),
    current = useRef({ longitude, latitude });
  useGSAP(
    () => {
      gsap.to(current.current, {
        longitude,
        latitude,
        duration: reduced ? 0 : 1,
        ease: 'power2.inOut',
        onUpdate: () => setPosition([current.current.longitude, current.current.latitude]),
      });
    },
    { dependencies: [longitude, latitude, reduced], revertOnUpdate: true },
  );
  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([260, 260])
        .scale(224)
        .rotate([-position[0]!, -position[1]!])
        .clipAngle(90),
    [position],
  );
  const path = geoPath(projection);
  return (
    <svg viewBox="0 0 520 520" className="flat-globe" aria-hidden="true">
      <defs>
        <radialGradient id={`ocean-${selected}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#284c61" />
          <stop offset="100%" stopColor="#132b40" />
        </radialGradient>
        <radialGradient id={`shade-${selected}`} cx="32%" cy="28%" r="75%">
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#081320" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx="260" cy="260" r="237" fill="none" stroke="#f3efdf" strokeOpacity=".15" />
      <circle cx="260" cy="260" r="224" fill={`url(#ocean-${selected})`} />
      <path
        d={path(geoGraticule10()) ?? ''}
        fill="none"
        stroke="#91adba"
        strokeOpacity=".25"
        strokeWidth=".7"
      />
      <path d={path(geography) ?? ''} fill="#d3cbb6" stroke="#a8a48f" strokeWidth=".5" />
      <circle cx="260" cy="260" r="224" fill={`url(#shade-${selected})`} />
      {destinations.map((destination) => {
        if (geoDistance(destination.coordinates, [position[0]!, position[1]!]) > Math.PI / 2)
          return null;
        const point = projection(destination.coordinates);
        return (
          point && (
            <g key={destination.id} transform={`translate(${point[0]},${point[1]})`}>
              <circle
                r={selected === destination.id ? 12 : 6}
                fill="#f56b3b"
                fillOpacity={selected === destination.id ? 0.28 : 1}
              />
              <circle
                r={selected === destination.id ? 5 : 3}
                fill={selected === destination.id ? '#ff956a' : '#fff9eb'}
              />
            </g>
          )
        );
      })}
    </svg>
  );
}
export default function Globe({ selected = 'madeira' }: { selected?: DestinationId }) {
  const destination = destinationById(selected)!,
    ref = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; offset: number } | null>(null);
  const [visible, setVisible] = useState(false),
    [supported] = useState(webglSupported),
    [rotation, setRotation] = useState({ id: selected, longitude: 0 });
  const offset = rotation.id === selected ? rotation.longitude : 0,
    longitude = destination.coordinates[0] + offset,
    latitude = destination.coordinates[1];
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const fallback = <FlatGlobe selected={selected} longitude={longitude} latitude={latitude} />;
  return (
    <div
      className="globe-shell"
      ref={ref}
      role="group"
      aria-label={`Destination globe, focused on ${destination.name}`}
    >
      <div className="globe-orbit orbit-one" />
      <div className="globe-orbit orbit-two" />
      <div
        className="globe-stage"
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') return;
          drag.current = { x: event.clientX, offset };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current)
            setRotation({
              id: selected,
              longitude: drag.current.offset - (event.clientX - drag.current.x) * 0.35,
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {visible && supported ? (
          <GlobeBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <ThreeGlobe selected={selected} longitude={longitude} latitude={latitude} />
            </Suspense>
          </GlobeBoundary>
        ) : (
          fallback
        )}
      </div>
      <span className="globe-north" aria-hidden="true">
        N <MoveUpRight />
      </span>
      <div className="globe-controls">
        <button
          className="icon-button"
          aria-label="Rotate globe west"
          onClick={() => setRotation({ id: selected, longitude: offset - 35 })}
        >
          <ArrowLeft />
        </button>
        <span>Drag to wander</span>
        <button
          className="icon-button"
          aria-label="Rotate globe east"
          onClick={() => setRotation({ id: selected, longitude: offset + 35 })}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
