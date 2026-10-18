import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Clock,
  GripVertical,
  Landmark,
  MapPin,
  Mountain,
  Pencil,
  Trash2,
  Waves,
} from 'lucide-react';
import { dayDate, money, type Stop, type Trip, type TripDay } from '../domain/trip';
import { placeById } from '../domain/catalog';
import { useCollection } from '../state/useCollection';
export function DayTab({
  day,
  index,
  startDate,
  active,
  onSelect,
}: {
  day: TripDay;
  index: number;
  startDate: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.id });
  return (
    <button
      ref={setNodeRef}
      className={`day-tab ${active ? 'active' : ''} ${isOver ? 'drop-target' : ''}`}
      aria-pressed={active}
      aria-label={`Day ${index + 1}${dayDate(startDate, index) ? `, ${dayDate(startDate, index)}` : ''}, ${day.stops.length} places`}
      onClick={onSelect}
    >
      <span>DAY {String(index + 1).padStart(2, '0')}</span>
      <strong>{dayDate(startDate, index) || 'Open to possibility'}</strong>
      <small>{day.stops.length} places</small>
    </button>
  );
}
const categoryIcons = { Landscape: Mountain, Coast: Waves, Culture: Landmark, Town: Building2 };
export function ItineraryStop({
  trip,
  day,
  stop,
  index,
  onEdit,
  onSelect,
  selected,
}: {
  trip: Trip;
  day: TripDay;
  stop: Stop;
  index: number;
  onEdit: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const { busy, command } = useCollection(),
    { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: stop.id,
      disabled: busy,
    });
  const place = placeById(trip.destinationId, stop.placeId)!,
    Icon = categoryIcons[place.category];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`itinerary-stop ${selected ? 'selected-stop' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="stop-order">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <button
          {...attributes}
          {...listeners}
          className="drag-handle icon-button"
          disabled={busy}
          aria-label={`Drag ${place.name}`}
        >
          <GripVertical aria-hidden="true" />
        </button>
      </div>
      <div className={`stop-type stop-type-${place.category.toLowerCase()}`}>
        <Icon aria-hidden="true" />
      </div>
      <div className="stop-content">
        <span className="tiny-label">{place.category}</span>
        <button className="stop-name" onClick={onSelect} aria-label={`Show ${place.name} on map`}>
          {place.name}
          <MapPin aria-hidden="true" />
        </button>
        <div className="stop-meta">
          <span>
            <Clock aria-hidden="true" />
            {place.minutes} min suggested
          </span>
          <span>{money(stop.allowanceCents)} / person</span>
        </div>
        {stop.notes && <p className="stop-note">{stop.notes}</p>}
        <div className="stop-bottom">
          <label className="move-label">
            <span className="sr-only">Move {place.name} to day</span>
            <select
              aria-label={`Move ${place.name} to day`}
              value={day.id}
              disabled={busy}
              onChange={(event) => {
                const target = trip.days.find((d) => d.id === event.target.value)!;
                void command(trip.id, {
                  type: 'move-stop',
                  stopId: stop.id,
                  dayId: target.id,
                  index: target.stops.length,
                });
              }}
            >
              {trip.days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  Day {i + 1}
                </option>
              ))}
            </select>
          </label>
          <div className="stop-actions">
            <button
              className="icon-button"
              disabled={busy || index === 0}
              aria-label={`Move ${place.name} up`}
              onClick={() =>
                void command(trip.id, {
                  type: 'move-stop',
                  stopId: stop.id,
                  dayId: day.id,
                  index: index - 1,
                })
              }
            >
              <ArrowUp />
            </button>
            <button
              className="icon-button"
              disabled={busy || index === day.stops.length - 1}
              aria-label={`Move ${place.name} down`}
              onClick={() =>
                void command(trip.id, {
                  type: 'move-stop',
                  stopId: stop.id,
                  dayId: day.id,
                  index: index + 1,
                })
              }
            >
              <ArrowDown />
            </button>
            <button className="icon-button" aria-label={`Edit ${place.name}`} onClick={onEdit}>
              <Pencil />
            </button>
            <button
              className="icon-button"
              disabled={busy}
              aria-label={`Remove ${place.name}`}
              onClick={() => void command(trip.id, { type: 'remove-stop', stopId: stop.id })}
            >
              <Trash2 />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
