import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  Download,
  MapPin,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import { destinationById, destinations, imagePath, placeById } from '../domain/catalog';
import { dayDate, money, tripBudget, type Stop, type Trip } from '../domain/trip';
import { useCollection } from '../state/useCollection';
import { CompassMark, DestinationCard, EmptyState, Eyebrow } from '../components/Shared';
import {
  BudgetSettings,
  ExportTrip,
  PrintableTrip,
  ShareTrip,
  StopSettings,
  TripSettings,
} from '../components/TripDialogs';
import { DayTab, ItineraryStop } from '../components/Itinerary';
import RouteMap from '../components/RouteMap';
import { usePageMotion } from '../components/usePageMotion';
type Modal =
  | { type: 'settings' | 'budget' | 'share' | 'export'; trip: Trip }
  | { type: 'stop'; trip: Trip; stop: Stop };
export default function Planner() {
  const { tripId } = useParams(),
    { data, busy, command } = useCollection(),
    trip = data?.trips.find((t) => t.id === tripId);
  const [selectedDay, setSelectedDay] = useState(''),
    [selectedPlace, setSelectedPlace] = useState(''),
    [modal, setModal] = useState<Modal | null>(null),
    [query, setQuery] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const root = usePageMotion<HTMLDivElement>(tripId);
  if (!tripId)
    return (
      <div className="section planner-start" ref={root}>
        <div className="page-intro" data-rise>
          <Eyebrow>The trip planner</Eyebrow>
          <h1>
            Every great story
            <br />
            starts <em>somewhere.</em>
          </h1>
          <div className="intro-bottom">
            <p>
              Choose a starting point. We’ll save a three-day outline.
              <br />
              Then you get to move the pieces around.
            </p>
            <CompassMark />
          </div>
        </div>
        <div className="planner-start-grid">
          {destinations.map((destination, i) => (
            <div key={destination.id}>
              <DestinationCard destination={destination} index={i} />
              <StartCard destinationId={destination.id} />
            </div>
          ))}
        </div>
        <div className="planner-start-note">
          <Check aria-hidden="true" />
          <p>
            Your itinerary saves as you edit. No account needed.
            <br />
            <Link to="/trips">
              Already have a plan? Open your trips <ArrowUpRight aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    );
  if (!trip)
    return (
      <div className="section">
        <EmptyState
          title="This trip is not in your collection."
          action={
            <Link className="button button-dark" to="/trips">
              Open my trips
            </Link>
          }
        >
          It may have been removed, or saved in another browser. Import a trip file or open a shared
          link to bring a copy here.
        </EmptyState>
      </div>
    );
  const destination = destinationById(trip.destinationId)!,
    day = trip.days.find((d) => d.id === selectedDay) ?? trip.days[0]!,
    dayIndex = trip.days.indexOf(day),
    budget = tripBudget(trip),
    scheduled = new Set(trip.days.flatMap((d) => d.stops.map((s) => s.placeId)));
  const available = destination.places.filter(
    (p) =>
      !scheduled.has(p.id) && `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const activePlace = day.stops.some((s) => s.placeId === selectedPlace)
    ? selectedPlace
    : day.stops[0]?.placeId;
  const minutes = day.stops.reduce(
    (sum, s) => sum + placeById(trip.destinationId, s.placeId)!.minutes,
    0,
  );
  function dragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !trip) return;
    const targetDay = trip.days.find(
      (d) => d.id === over.id || d.stops.some((s) => s.id === over.id),
    );
    if (!targetDay) return;
    const index = targetDay.stops.findIndex((s) => s.id === over.id);
    void command(trip.id, {
      type: 'move-stop',
      stopId: String(active.id),
      dayId: targetDay.id,
      index: index < 0 ? targetDay.stops.length : index,
    });
  }
  return (
    <div className="planner-page" ref={root}>
      <section className="trip-cover">
        <img src={imagePath(destination.id)} alt="" width="800" height="480" />
        <div className="trip-cover-shade" />
        <div className="trip-cover-copy">
          <Link className="back-link" to="/trips">
            <ArrowLeft aria-hidden="true" /> My trips
          </Link>
          <div className="trip-heading-row">
            <div>
              <span className="tiny-label">{destination.country} / Your next chapter</span>
              <h1>{trip.title}</h1>
              <p>
                <MapPin aria-hidden="true" />
                {destination.name}
                <span>·</span>
                {trip.days.length} days<span>·</span>
                {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}
                {trip.startDate && (
                  <>
                    <span>·</span>
                    {dayDate(trip.startDate, 0)}
                  </>
                )}
              </p>
            </div>
            <button
              className="button button-light button-small"
              onClick={() => setModal({ type: 'settings', trip })}
            >
              <Pencil aria-hidden="true" />
              Trip details
            </button>
          </div>
        </div>
      </section>
      <div className="planner-utility">
        <span className="save-indicator">
          <span className={busy ? 'saving-dot' : 'saved-dot'} />
          {busy ? 'Saving your changes…' : 'Saved in this browser'}
        </span>
        <div className="button-row">
          <Link className="text-link" to={`/destinations/${destination.id}`}>
            Destination notes
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <button
            className="button button-outline button-small"
            onClick={() => setModal({ type: 'share', trip })}
          >
            <Share2 aria-hidden="true" />
            Share
          </button>
          <button
            className="button button-dark button-small"
            onClick={() => setModal({ type: 'export', trip })}
          >
            <Download aria-hidden="true" />
            Export
          </button>
        </div>
      </div>
      <div className="planner-layout">
        <section className="itinerary-panel" aria-label="Daily itinerary">
          <DndContext
            sensors={sensors}
            collisionDetection={(args) =>
              args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)
            }
            onDragEnd={dragEnd}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  'Press Space to pick up this place. Use the arrow keys to reorder within this day. Press Space to drop or Escape to cancel. To move between days, use the Move to day selection on the place card.',
              },
            }}
          >
            <div className="day-tabs" aria-label="Itinerary days">
              {trip.days.map((d, i) => (
                <DayTab
                  key={d.id}
                  day={d}
                  index={i}
                  startDate={trip.startDate}
                  active={day.id === d.id}
                  onSelect={() => setSelectedDay(d.id)}
                />
              ))}
              <button
                className="add-day-button"
                disabled={busy || trip.days.length >= 10}
                onClick={async () => {
                  const result = await command(trip.id, { type: 'add-day' });
                  if (result.ok) {
                    const last = result.value.trips.find((t) => t.id === trip.id)?.days.at(-1);
                    if (last) setSelectedDay(last.id);
                  }
                }}
              >
                <Plus aria-hidden="true" />
                <span>Add day</span>
              </button>
            </div>
            <div className="day-heading">
              <div>
                <p className="tiny-label">
                  {dayDate(trip.startDate, dayIndex) || 'Make room for a good day'}
                </p>
                <h2>
                  Day {String(dayIndex + 1).padStart(2, '0')}
                  <span>{day.stops.length} places</span>
                </h2>
              </div>
              {!day.stops.length && trip.days.length > 1 ? (
                <button
                  className="icon-button"
                  disabled={busy}
                  aria-label={`Remove empty day ${dayIndex + 1}`}
                  onClick={() => void command(trip.id, { type: 'remove-day', dayId: day.id })}
                >
                  <Trash2 />
                </button>
              ) : (
                <span className="day-time">
                  <Clock aria-hidden="true" />
                  {Math.floor(minutes / 60)}h {minutes % 60 ? `${minutes % 60}m` : ''}
                  <small>at places</small>
                </span>
              )}
            </div>
            <p className="drag-instructions">
              Drag to reorder or drop onto a day. Keyboard: Space, arrows, Space. Each card also has
              move controls.
            </p>
            <SortableContext
              items={day.stops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="itinerary-list" aria-label={`Day ${dayIndex + 1} places`}>
                {day.stops.map((stop, index) => (
                  <ItineraryStop
                    key={stop.id}
                    trip={trip}
                    day={day}
                    stop={stop}
                    index={index}
                    selected={activePlace === stop.placeId}
                    onSelect={() => setSelectedPlace(stop.placeId)}
                    onEdit={() => setModal({ type: 'stop', trip, stop })}
                  />
                ))}
              </ol>
            </SortableContext>
            {!day.stops.length && (
              <div className="empty-day">
                <CompassMark />
                <h3>A little room for possibility.</h3>
                <p>Add a place below, or move one here from another day.</p>
              </div>
            )}
          </DndContext>
          <section className="place-bank">
            <div className="place-bank-heading">
              <div>
                <span className="tiny-label">Room for one more?</span>
                <h3>
                  Add a place
                  <ChevronDown aria-hidden="true" />
                </h3>
              </div>
              <span>{destination.places.length - scheduled.size} left to discover</span>
            </div>
            <label className="sr-only" htmlFor="place-search">
              Search available places
            </label>
            <input
              className="place-search"
              id="place-search"
              placeholder="Find a place in this destination…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={80}
            />
            <div className="place-bank-list">
              {available.map((place) => (
                <div key={place.id}>
                  <div>
                    <span className="tiny-label">{place.category}</span>
                    <strong>{place.name}</strong>
                  </div>
                  <button
                    className="icon-button"
                    disabled={busy || day.stops.length >= 8}
                    aria-label={`Add ${place.name} to day ${dayIndex + 1}`}
                    onClick={() =>
                      void command(trip.id, { type: 'add-stop', dayId: day.id, placeId: place.id })
                    }
                  >
                    <Plus />
                  </button>
                </div>
              ))}
              {!available.length && (
                <p className="small-note">
                  {scheduled.size === destination.places.length
                    ? 'Every place in this collection has a day. Leave some space between them.'
                    : 'No available places match that search.'}
                </p>
              )}
            </div>
          </section>
        </section>
        <aside className="planner-aside" aria-label="Trip map and budget">
          <RouteMap
            destination={destination}
            trip={trip}
            day={day}
            {...(activePlace ? { selected: activePlace } : {})}
            onSelect={setSelectedPlace}
          />
          <section className={`budget-panel ${budget.remaining < 0 ? 'over-budget' : ''}`}>
            <div className="budget-panel-heading">
              <h2>A little perspective.</h2>
              <button
                className="icon-button"
                aria-label="Edit budget allowances"
                onClick={() => setModal({ type: 'budget', trip })}
              >
                <Pencil />
              </button>
            </div>
            <p className="tiny-label">Estimated trip total</p>
            <div className="budget-total">
              {money(budget.total)}
              <span>{money(budget.perPerson)} / traveller</span>
            </div>
            <meter
              min={0}
              max={trip.budget.limitCents || 1}
              value={Math.min(budget.total, trip.budget.limitCents || 1)}
              aria-label="Trip budget used"
            />
            <p className="budget-remaining">
              {budget.remaining < 0
                ? `${money(-budget.remaining)} over your budget`
                : `${money(budget.remaining)} room in your budget`}
              <span>of {money(trip.budget.limitCents)}</span>
            </p>
            <dl>
              <div>
                <dt>
                  Stay{' '}
                  <span>
                    {budget.nights} nights × {budget.rooms} rooms
                  </span>
                </dt>
                <dd>{money(budget.lodging)}</dd>
              </div>
              <div>
                <dt>
                  Food{' '}
                  <span>
                    {trip.days.length} days × {trip.travellers} people
                  </span>
                </dt>
                <dd>{money(budget.food)}</dd>
              </div>
              <div>
                <dt>
                  Transport <span>Shared daily allowance</span>
                </dt>
                <dd>{money(budget.transport)}</dd>
              </div>
              <div>
                <dt>
                  Places <span>Allowances for the group</span>
                </dt>
                <dd>{money(budget.activities)}</dd>
              </div>
            </dl>
            <p className="small-note">
              Illustrative EUR allowances, not quotes. Flights and insurance are excluded. Change
              the numbers to match your own plan.
            </p>
          </section>
        </aside>
      </div>
      <PrintableTrip trip={trip} />
      {modal?.type === 'settings' && (
        <TripSettings trip={modal.trip} onClose={() => setModal(null)} />
      )}{' '}
      {modal?.type === 'budget' && (
        <BudgetSettings trip={modal.trip} onClose={() => setModal(null)} />
      )}{' '}
      {modal?.type === 'stop' && (
        <StopSettings trip={modal.trip} stop={modal.stop} onClose={() => setModal(null)} />
      )}{' '}
      {modal?.type === 'share' && <ShareTrip trip={modal.trip} onClose={() => setModal(null)} />}{' '}
      {modal?.type === 'export' && <ExportTrip trip={modal.trip} onClose={() => setModal(null)} />}
    </div>
  );
}

function StartCard({ destinationId }: { destinationId: Trip['destinationId'] }) {
  const { start, busy } = useCollection(),
    navigate = useNavigate();
  return (
    <button
      disabled={busy}
      className="button button-dark planner-start-button"
      onClick={async () => {
        const result = await start(destinationId);
        if (result.ok) void navigate(`/plan/${result.value}`);
      }}
    >
      Start a 3-day plan
      <Plus aria-hidden="true" />
    </button>
  );
}
