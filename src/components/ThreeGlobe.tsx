import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Euler, Quaternion, SRGBColorSpace, type Group } from 'three';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { geography } from '../data/geography';
import { destinations, type DestinationId } from '../domain/catalog';
import { useMotion } from './useMotion';
const RADIANS = Math.PI / 180;
function Earth({
  selected,
  longitude,
  latitude,
  reduced,
}: {
  selected: DestinationId;
  longitude: number;
  latitude: number;
  reduced: boolean;
}) {
  const group = useRef<Group>(null),
    { invalidate } = useThree();
  const target = useMemo(
    () =>
      new Quaternion().setFromEuler(
        new Euler(latitude * RADIANS, -Math.PI / 2 - longitude * RADIANS, 0, 'XYZ'),
      ),
    [longitude, latitude],
  );
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Globe texture is unavailable.');
    context.fillStyle = '#18384b';
    context.fillRect(0, 0, 2048, 1024);
    const projection = geoEquirectangular()
      .translate([1024, 512])
      .scale(2048 / (2 * Math.PI));
    const path = geoPath(projection, context);
    context.beginPath();
    path(geoGraticule10());
    context.strokeStyle = '#385668';
    context.lineWidth = 1;
    context.stroke();
    context.beginPath();
    path(geography);
    context.fillStyle = '#d5cdb9';
    context.fill();
    context.strokeStyle = '#b7b09d';
    context.lineWidth = 0.7;
    context.stroke();
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    invalidate();
  }, [target, invalidate, selected]);
  useFrame((_, delta) => {
    if (!group.current) return;
    if (reduced) group.current.quaternion.copy(target);
    else group.current.quaternion.slerp(target, 1 - Math.exp(-delta * 6));
    if (group.current.quaternion.angleTo(target) > 0.002) invalidate();
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
      </mesh>
      {destinations.map((destination) => {
        const [lon, lat] = destination.coordinates.map((v) => v * RADIANS) as [number, number];
        const point: [number, number, number] = [
          1.012 * Math.cos(lat) * Math.cos(lon),
          1.012 * Math.sin(lat),
          -1.012 * Math.cos(lat) * Math.sin(lon),
        ];
        return (
          <mesh key={destination.id} position={point}>
            <sphereGeometry args={[destination.id === selected ? 0.019 : 0.011, 12, 8]} />
            <meshBasicMaterial color={destination.id === selected ? '#ff7943' : '#fff6e3'} />
          </mesh>
        );
      })}
    </group>
  );
}
export default function ThreeGlobe({
  selected,
  longitude,
  latitude,
}: {
  selected: DestinationId;
  longitude: number;
  latitude: number;
}) {
  const { reduced } = useMotion();
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 3], fov: 46 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <ambientLight intensity={2.2} />
      <directionalLight position={[-3, 4, 5]} intensity={2} />
      <Earth selected={selected} longitude={longitude} latitude={latitude} reduced={reduced} />
    </Canvas>
  );
}
