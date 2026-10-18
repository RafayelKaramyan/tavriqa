import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, BookmarkPlus, MapPin } from 'lucide-react';
import { parseShare } from '../domain/transfer';
import { destinationById, imagePath, photoAlt, placeById } from '../domain/catalog';
import { money, tripBudget } from '../domain/trip';
import { useCollection } from '../state/useCollection';
import { collection } from '../state/repository';
import { EmptyState, Eyebrow } from '../components/Shared';
export default function Import() {
  const [params] = useSearchParams(),
    token = params.get('trip') ?? '',
    { busy, execute } = useCollection(),
    navigate = useNavigate();
  const preview = useMemo(() => {
    try {
      return { trip: parseShare(token), error: '' };
    } catch (cause) {
      return {
        trip: null,
        error: cause instanceof Error ? cause.message : 'This link could not be opened.',
      };
    }
  }, [token]);
  if (!preview.trip)
    return (
      <div className="section">
        <EmptyState
          title="This shared chapter could not open."
          action={
            <Link className="button button-dark" to="/destinations">
              Find your own direction
              <ArrowUpRight aria-hidden="true" />
            </Link>
          }
        >
          {preview.error}
        </EmptyState>
      </div>
    );
  const trip = preview.trip,
    destination = destinationById(trip.destinationId)!;
  return (
    <div className="section import-page">
      <div className="page-intro">
        <Eyebrow>A little inspiration, shared</Eyebrow>
        <h1>
          A story worth
          <br />
          <em>making your own.</em>
        </h1>
        <p>
          Preview this itinerary, then save a separate copy. Your existing trips will stay as they
          are.
        </p>
      </div>
      <div className="shared-trip-preview">
        <img
          src={imagePath(destination.id)}
          alt={photoAlt[destination.id]}
          width="800"
          height="600"
        />
        <div>
          <span className="tiny-label">
            <MapPin aria-hidden="true" />
            {destination.name}, {destination.country}
          </span>
          <h2>{trip.title}</h2>
          <p>
            {trip.days.length} days · {trip.travellers} travellers · {money(tripBudget(trip).total)}{' '}
            illustrative total
          </p>
          <button
            className="button button-dark"
            disabled={busy}
            onClick={async () => {
              const copy = parseShare(token),
                result = await execute(
                  (lease) => collection.add(lease, copy),
                  'Shared trip saved as your own copy.',
                );
              if (result.ok) void navigate(`/plan/${copy.id}`);
            }}
          >
            Save a copy to my trips
            <BookmarkPlus aria-hidden="true" />
          </button>
          <p className="small-note">Notes and allowances are included. Nothing is booked.</p>
        </div>
      </div>
      <div className="shared-days">
        {trip.days.map((day, i) => (
          <section key={day.id}>
            <span className="tiny-label">Day {i + 1}</span>
            <h2>{day.stops.length} places to connect</h2>
            <ol>
              {day.stops.map((stop) => (
                <li key={stop.id}>
                  <strong>{placeById(trip.destinationId, stop.placeId)!.name}</strong>
                  {stop.notes && <p>{stop.notes}</p>}
                </li>
              ))}
            </ol>
            {!day.stops.length && <p>A little room for the unexpected.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
