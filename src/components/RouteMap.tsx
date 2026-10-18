import { useMemo } from 'react';
import { MapPin, Minus, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { Destination } from '../domain/catalog';
import { dayDistance, type Trip, type TripDay } from '../domain/trip';
export default function RouteMap({
  destination,
  trip,
  day,
  onSelect,
  selected,
}: {
  destination: Destination;
  trip?: Trip;
  day?: TripDay;
  onSelect?: (id: string) => void;
  selected?: string;
}) {
  const [zoom, setZoom] = useState(1),
    stops = day?.stops ?? [],
    assigned = trip?.days.flatMap((d) => d.stops) ?? [];
  const points = useMemo(() => {
    const xs = destination.places.map((p) => p.coordinates[0]),
      ys = destination.places.map((p) => p.coordinates[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const correction = Math.cos((destination.coordinates[1] * Math.PI) / 180),
      dx = (maxX - minX) * correction,
      dy = maxY - minY,
      scale = Math.min(420 / Math.max(dx, 0.02), 300 / Math.max(dy, 0.02));
    return destination.places.map((place) => ({
      ...place,
      x: 280 + (place.coordinates[0] - (minX + maxX) / 2) * correction * scale,
      y: 220 - (place.coordinates[1] - (minY + maxY) / 2) * scale,
    }));
  }, [destination]);
  const route = stops.map((s) => points.find((p) => p.id === s.placeId)!);
  return (
    <div className="route-map">
      <div className="map-heading">
        <span>
          <MapPin aria-hidden="true" />
          {destination.name}
        </span>
        <span>
          {trip && day ? `${Math.round(dayDistance(trip, day))} km direct` : 'Place collection'}
        </span>
      </div>
      <svg
        viewBox="0 0 560 440"
        role="img"
        aria-label={`${destination.name} schematic map${day ? `, ${stops.length} places in selected day` : ''}`}
      >
        <defs>
          <pattern
            id={`map-grid-${destination.id}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#172e40" strokeOpacity=".07" />
          </pattern>
        </defs>
        <rect width="560" height="440" fill="#e5e7dc" />
        <rect width="560" height="440" fill={`url(#map-grid-${destination.id})`} />
        <g transform={`translate(280 220) scale(${zoom}) translate(-280 -220)`}>
          <g fill="none" stroke="#9da991" strokeWidth="1" opacity=".45">
            {Array.from({ length: 8 }, (_, i) => (
              <path
                key={i}
                d={`M -30 ${120 + i * 30} Q ${100 + i * 10} ${-120 + i * 25} ${220 + i * 5} ${110 + i * 30} T 600 ${60 + i * 45}`}
              />
            ))}
          </g>
          <text x="280" y="240" textAnchor="middle" className="map-region-name">
            {destination.name}
          </text>
          {route.length > 1 && (
            <path
              key={route.map((p) => p.id).join('-')}
              className="map-route-line"
              pathLength="1"
              d={route.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="#bc4d27"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}
          {points.map((point, pointIndex) => {
            const index = stops.findIndex((s) => s.placeId === point.id),
              included = index >= 0,
              planned = assigned.some((s) => s.placeId === point.id);
            return (
              <g key={point.id} transform={`translate(${point.x} ${point.y})`}>
                <circle
                  r={point.id === selected ? 20 : included ? 14 : 8}
                  fill={included ? '#132333' : planned ? '#8b9b88' : '#faf7ee'}
                  stroke={point.id === selected ? '#d6532a' : included ? '#f9f6ed' : '#5e715c'}
                  strokeWidth={point.id === selected ? 3 : 1.5}
                />
                {included && (
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
                    {index + 1}
                  </text>
                )}
                {(point.id === selected || (!selected && pointIndex % 2 === 0)) && (
                  <text
                    x="0"
                    y={included ? -22 : -17}
                    textAnchor="middle"
                    className="map-pin-label"
                    paintOrder="stroke"
                    stroke="#e5e7dc"
                    strokeWidth="4"
                    fill="#162b3a"
                  >
                    {point.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <text x="28" y="413" className="map-coordinate">
          {destination.coordinates[1].toFixed(2)}° N /{' '}
          {Math.abs(destination.coordinates[0]).toFixed(2)}°{' '}
          {destination.coordinates[0] < 0 ? 'W' : 'E'}
        </text>
        <path d="m520 385 7 16-7-4-7 4Z" fill="#132333" />
        <text x="520" y="378" textAnchor="middle" fontSize="9">
          N
        </text>
      </svg>
      <div className="map-tools">
        <button
          className="icon-button"
          aria-label="Zoom map out"
          disabled={zoom <= 0.8}
          onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}
        >
          <Minus />
        </button>
        <button className="icon-button" aria-label="Reset map zoom" onClick={() => setZoom(1)}>
          <RotateCcw />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom map in"
          disabled={zoom >= 1.6}
          onClick={() => setZoom(Math.min(1.6, zoom + 0.2))}
        >
          <Plus />
        </button>
      </div>
      <p className="map-caption">
        Schematic map · approximate locations · direct lines, not road routes
      </p>
      {onSelect && (
        <div className="map-place-controls" aria-label="Select a mapped place">
          {route.map((p, i) => (
            <button
              key={p.id}
              className={selected === p.id ? 'active' : ''}
              aria-pressed={selected === p.id}
              onClick={() => onSelect(p.id)}
            >
              {i + 1}. {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
