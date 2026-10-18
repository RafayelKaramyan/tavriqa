import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe2, LayoutGrid, Search, X } from 'lucide-react';
import { destinations, type DestinationId } from '../domain/catalog';
import { DestinationCard, EmptyState, Eyebrow, StartTrip } from '../components/Shared';
import Globe from '../components/DeferredGlobe';
import { usePageMotion } from '../components/usePageMotion';
export default function Destinations() {
  const [params, setParams] = useSearchParams(),
    [selected, setSelected] = useState<DestinationId>('madeira');
  const query = params.get('q') ?? '',
    landscape = params.get('landscape') ?? 'all',
    view = params.get('view') === 'globe' ? 'globe' : 'grid';
  function change(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== 'all' && value !== 'grid') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  const results = destinations.filter(
    (d) =>
      `${d.name} ${d.country} ${d.region} ${d.tags.join(' ')} ${d.short}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (landscape === 'all' || d.tags.some((t) => t.toLowerCase() === landscape)),
  );
  const selectedDestination =
    results.find((d) => d.id === selected) ?? results[0] ?? destinations[0]!;
  const root = usePageMotion<HTMLDivElement>(`${query}-${landscape}-${view}`);
  return (
    <div className="section destinations-page" ref={root}>
      <div className="page-intro" data-rise>
        <Eyebrow>The destination atlas</Eyebrow>
        <h1>
          Where does your
          <br />
          <em>curiosity go?</em>
        </h1>
        <div className="intro-bottom">
          <p>
            A small collection, thoughtfully chosen.
            <br />
            Find a landscape. Shape a journey.
          </p>
          <span className="editorial-index">
            01—04 <span>FIELD NOTES</span>
          </span>
        </div>
      </div>
      <div className="explore-toolbar">
        <div className="explore-search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="destination-search">
            Search destinations
          </label>
          <input
            id="destination-search"
            value={query}
            onChange={(event) => change('q', event.target.value)}
            maxLength={80}
            placeholder="Try Madeira, mountains, forest…"
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear destination search"
              onClick={() => change('q', '')}
            >
              <X />
            </button>
          )}
        </div>
        <div className="landscape-filters" aria-label="Landscape filters">
          {[
            ['all', 'All places'],
            ['coast', 'Coast'],
            ['mountains', 'Mountains'],
            ['forest', 'Forest'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={landscape === value ? 'active' : ''}
              aria-pressed={landscape === value}
              onClick={() => change('landscape', value!)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="view-switch" aria-label="Destination view">
          <button
            className={view === 'grid' ? 'active' : ''}
            aria-label="Card view"
            aria-pressed={view === 'grid'}
            onClick={() => change('view', 'grid')}
          >
            <LayoutGrid />
          </button>
          <button
            className={view === 'globe' ? 'active' : ''}
            aria-label="Globe view"
            aria-pressed={view === 'globe'}
            onClick={() => change('view', 'globe')}
          >
            <Globe2 />
          </button>
        </div>
      </div>
      <div className="result-heading">
        <p role="status">
          {results.length} {results.length === 1 ? 'direction' : 'directions'} to explore
        </p>
        {(query || landscape !== 'all') && (
          <button
            className="text-button"
            onClick={() => setParams(view === 'globe' ? { view: 'globe' } : {}, { replace: true })}
          >
            Reset filters
          </button>
        )}
      </div>
      {!results.length ? (
        <EmptyState
          title="A little beyond this atlas."
          action={
            <button className="button button-dark" onClick={() => setParams({})}>
              See all destinations
            </button>
          }
        >
          Try another place or landscape. This collection currently covers four destinations.
        </EmptyState>
      ) : view === 'grid' ? (
        <div className="destination-grid destination-grid-large">
          {results.map((d) => (
            <DestinationCard key={d.id} destination={d} index={destinations.indexOf(d)} />
          ))}
        </div>
      ) : (
        <section className="explore-globe">
          <div className="explore-globe-stage">
            <Globe selected={selectedDestination.id} />
          </div>
          <div className="explore-globe-list">
            <p className="tiny-label">Choose a point. Turn the page.</p>
            {results.map((d) => (
              <button
                key={d.id}
                className={selectedDestination.id === d.id ? 'active' : ''}
                aria-pressed={selectedDestination.id === d.id}
                onClick={() => setSelected(d.id)}
              >
                <span>{d.country}</span>
                <strong>{d.name}</strong>
                <small>{d.short}</small>
              </button>
            ))}
            <StartTrip
              destination={selectedDestination}
              label={`Plan ${selectedDestination.name}`}
            />
          </div>
        </section>
      )}
      <div className="atlas-note">
        <span className="tiny-label">A note from the atlas</span>
        <p>
          These are starting points, with sample planning allowances. Check official destination
          information before making travel arrangements. Leave room in your plan for the day you
          actually find.
        </p>
      </div>
    </div>
  );
}
