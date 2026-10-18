import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Copy, Plus, Search, Trash2, Upload } from 'lucide-react';
import { destinationById, destinations, imagePath, photoAlt } from '../domain/catalog';
import { money, tripBudget, type Trip } from '../domain/trip';
import { exportTrip, importTrip } from '../domain/transfer';
import { useCollection } from '../state/useCollection';
import { collection } from '../state/repository';
import { DestinationCard, Dialog, EmptyState, Eyebrow } from '../components/Shared';
import { usePageMotion } from '../components/usePageMotion';
export default function Trips() {
  const { data, busy, execute } = useCollection(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams(),
    root = usePageMotion<HTMLDivElement>(params.get('tab'));
  const [query, setQuery] = useState(''),
    [sort, setSort] = useState('recent'),
    [remove, setRemove] = useState<Trip | null>(null),
    [error, setError] = useState(''),
    input = useRef<HTMLInputElement>(null);
  const tab = params.get('tab') === 'destinations' ? 'destinations' : 'trips';
  const trips = [...(data?.trips ?? [])]
    .filter((t) =>
      `${t.title} ${destinationById(t.destinationId)!.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'name' ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt),
    );
  const saved = destinations.filter((d) => data?.bookmarks.includes(d.id));
  return (
    <div className="section trips-page" ref={root}>
      <div className="page-intro" data-rise>
        <Eyebrow>Your collection</Eyebrow>
        <h1>
          Good things
          <br />
          <em>to come back to.</em>
        </h1>
        <div className="intro-bottom">
          <p>
            Your next chapter, a few ideas for later,
            <br />
            and a little room to change your mind.
          </p>
          <div className="button-row">
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              hidden
              aria-label="Import a Tavriqa trip file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setError('');
                try {
                  if (file.size > 200_000)
                    throw new Error('Choose a trip file smaller than 200 KB.');
                  const trip = importTrip(await file.text()),
                    result = await execute(
                      (lease) => collection.add(lease, trip),
                      'Trip imported as a new copy.',
                    );
                  if (result.ok) void navigate(`/plan/${trip.id}`);
                  else setError(result.error);
                } catch (cause) {
                  setError(
                    cause instanceof Error ? cause.message : 'That file could not be imported.',
                  );
                }
              }}
            />
            <button
              className="button button-outline"
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              <Upload aria-hidden="true" />
              Import a trip
            </button>
            <Link className="button button-dark" to="/planner">
              New chapter
              <Plus aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="collection-tabs" aria-label="Saved collection view">
        <button
          className={tab === 'trips' ? 'active' : ''}
          aria-pressed={tab === 'trips'}
          onClick={() => setParams({})}
        >
          My trips <span>{data?.trips.length ?? 0}</span>
        </button>
        <button
          className={tab === 'destinations' ? 'active' : ''}
          aria-pressed={tab === 'destinations'}
          onClick={() => setParams({ tab: 'destinations' })}
        >
          Saved places <span>{saved.length}</span>
        </button>
      </div>
      {tab === 'trips' ? (
        <>
          {Boolean(data?.trips.length) && (
            <div className="trip-list-toolbar">
              <div className="explore-search">
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="trip-search">
                  Search my trips
                </label>
                <input
                  id="trip-search"
                  placeholder="Find a chapter…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  maxLength={80}
                />
              </div>
              <label className="sort-label">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort trips"
                >
                  <option value="recent">Recently edited</option>
                  <option value="name">Trip name</option>
                </select>
              </label>
            </div>
          )}
          {trips.length ? (
            <div className="trip-list">
              {trips.map((trip) => {
                const destination = destinationById(trip.destinationId)!;
                return (
                  <article key={trip.id} className="saved-trip-card" data-rise>
                    <Link
                      to={`/plan/${trip.id}`}
                      className="saved-trip-image"
                      aria-label={`Open ${trip.title}`}
                    >
                      <img
                        src={imagePath(destination.id)}
                        alt={photoAlt[destination.id]}
                        loading="lazy"
                        width="480"
                        height="360"
                      />
                    </Link>
                    <div className="saved-trip-copy">
                      <span className="tiny-label">
                        {destination.country} / {destination.name}
                      </span>
                      <h2>
                        <Link to={`/plan/${trip.id}`}>{trip.title}</Link>
                      </h2>
                      <p>
                        {trip.days.length} days <span>·</span> {trip.travellers}{' '}
                        {trip.travellers === 1 ? 'traveller' : 'travellers'} <span>·</span>{' '}
                        {trip.days.flatMap((d) => d.stops).length} places
                      </p>
                      <div className="saved-trip-bottom">
                        <strong>
                          {money(tripBudget(trip).total)}
                          <small>planning estimate</small>
                        </strong>
                        <Link className="text-link" to={`/plan/${trip.id}`}>
                          Open your plan <ArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                    <div className="saved-trip-actions">
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={`Duplicate ${trip.title}`}
                        onClick={async () => {
                          const copy = importTrip(JSON.stringify(exportTrip(trip)));
                          copy.title = `${trip.title.slice(0, 73)} (copy)`;
                          const result = await execute(
                            (lease) => collection.add(lease, copy),
                            'A separate copy is saved.',
                          );
                          if (result.ok) void navigate(`/plan/${copy.id}`);
                        }}
                      >
                        <Copy />
                      </button>
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={`Delete ${trip.title}`}
                        onClick={() => {
                          setRemove(trip);
                          setError('');
                        }}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={
                data?.trips.length ? 'No matching chapters.' : 'Your next story is still unwritten.'
              }
              action={
                data?.trips.length ? (
                  <button className="button button-dark" onClick={() => setQuery('')}>
                    Clear trip search
                  </button>
                ) : (
                  <Link className="button button-dark" to="/planner">
                    Choose your starting point
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                )
              }
            >
              {data?.trips.length
                ? 'Try another trip name or destination.'
                : 'Start with a destination, or import a trip file. Your saved plans will live here.'}
            </EmptyState>
          )}
          <p className="collection-footnote">
            Your collection is stored in this browser. Export a trip file to keep a backup or move
            it to another device. Up to 24 trips.
          </p>
        </>
      ) : saved.length ? (
        <div className="destination-grid destination-grid-large">
          {saved.map((d) => (
            <DestinationCard key={d.id} destination={d} index={destinations.indexOf(d)} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Keep a little inspiration."
          action={
            <Link className="button button-dark" to="/destinations">
              Explore the atlas
              <ArrowUpRight aria-hidden="true" />
            </Link>
          }
        >
          Tap the bookmark on a destination to keep it here for later.
        </EmptyState>
      )}
      {remove && (
        <Dialog title="Let this chapter go?" onClose={() => setRemove(null)}>
          <p>
            Delete “{remove.title}” and its notes from this browser? This cannot be undone. Export a
            trip file first if you want a backup.
          </p>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button className="button button-outline" onClick={() => setRemove(null)}>
              Keep my trip
            </button>
            <button
              className="button button-danger"
              disabled={busy}
              onClick={async () => {
                const result = await execute(
                  (lease) => collection.remove(lease, remove.id, remove.revision),
                  'Trip removed from your collection.',
                );
                if (result.ok) setRemove(null);
                else setError(result.error);
              }}
            >
              Delete trip permanently
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
