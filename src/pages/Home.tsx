import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { destinations, imagePath, photoAlt, type DestinationId } from '../domain/catalog';
import { Arrow, CompassMark, DestinationCard, Eyebrow, StartTrip } from '../components/Shared';
import Globe from '../components/DeferredGlobe';
import { usePageMotion } from '../components/usePageMotion';

export default function Home() {
  const [featured, setFeatured] = useState<DestinationId>('madeira'),
    [globe, setGlobe] = useState<DestinationId>('iceland');
  const destination = destinations.find((d) => d.id === featured)!,
    globeDestination = destinations.find((d) => d.id === globe)!;
  const [query, setQuery] = useState(''),
    [landscape, setLandscape] = useState('all'),
    navigate = useNavigate(),
    root = usePageMotion<HTMLDivElement>();
  return (
    <div ref={root}>
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="hero-scene" key={featured}>
          <img
            className="hero-photo"
            src={imagePath(featured, 1800)}
            srcSet={`${imagePath(featured)} 800w, ${imagePath(featured, 1800)} 1800w`}
            sizes="100vw"
            alt={photoAlt[featured]}
            fetchPriority="high"
            width="1800"
            height="1200"
            style={{ objectPosition: destination.imagePosition }}
          />
          <div className="hero-shade" />
        </div>
        <div className="hero-topline">
          <span>For the beautifully curious.</span>
          <span className="tiny-label">Independent journeys / 01—04</span>
        </div>
        <div className="hero-heading">
          <p className="eyebrow">
            <span /> A different kind of getting away
          </p>
          <h1 id="hero-heading">
            <span>Take the</span>
            <span>
              <em>long</em> way<span className="hero-period">.</span>
            </span>
          </h1>
        </div>
        <Link
          to="/destinations"
          className="hero-seal"
          aria-label="Discover somewhere less ordinary"
        >
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              <path id="seal-circle" d="M80,80m-60,0a60,60 0 1,1 120,0a60,60 0 1,1 -120,0" />
            </defs>
            <text>
              <textPath href="#seal-circle">
                SOMEWHERE LESS ORDINARY · SOMEWHERE LESS ORDINARY ·{' '}
              </textPath>
            </text>
          </svg>
          <ArrowUpRight />
        </Link>
        <div className="hero-bottom">
          <div className="hero-destination">
            <span className="hero-location">
              <MapPin aria-hidden="true" />
              {destination.country} / {destination.region}
            </span>
            <h2>{destination.name}</h2>
            <p>{destination.short}</p>
            <Link to={`/destinations/${featured}`}>
              Step into the story <Arrow diagonal />
            </Link>
          </div>
          <div className="hero-selector" aria-label="Featured destination">
            {destinations.map((d, i) => (
              <button
                key={d.id}
                className={featured === d.id ? 'active' : ''}
                aria-label={`Feature ${d.name}`}
                aria-pressed={featured === d.id}
                onClick={() => setFeatured(d.id)}
              >
                <span className="hero-thumb">
                  <img
                    src={imagePath(d.id)}
                    width="100"
                    height="76"
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </span>
                <span className="hero-thumb-number">0{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
        <a
          href="#journeys"
          className="hero-scroll"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById('journeys')?.scrollIntoView({ block: 'start' });
          }}
        >
          <ArrowDown aria-hidden="true" /> Keep wandering
        </a>
      </section>
      <div className="home-search-wrap">
        <form
          className="home-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const params = new URLSearchParams();
            if (query.trim()) params.set('q', query.trim());
            if (landscape !== 'all') params.set('landscape', landscape);
            void navigate(`/destinations${params.size ? `?${params}` : ''}`);
          }}
        >
          <div className="search-field">
            <Search aria-hidden="true" />
            <label htmlFor="home-search">
              Your next direction
              <input
                id="home-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="A place, a landscape, a feeling…"
                maxLength={80}
              />
            </label>
          </div>
          <div className="search-mood">
            <SlidersHorizontal aria-hidden="true" />
            <label htmlFor="home-landscape">
              What draws you in?
              <select
                id="home-landscape"
                value={landscape}
                onChange={(event) => setLandscape(event.target.value)}
              >
                <option value="all">A little of everything</option>
                <option value="coast">The coast</option>
                <option value="mountains">The mountains</option>
                <option value="forest">The forest</option>
              </select>
            </label>
          </div>
          <button className="button button-orange" type="submit">
            Explore the atlas <Arrow />
          </button>
        </form>
      </div>
      <section className="section journeys-section" id="journeys">
        <div className="section-heading" data-rise>
          <div>
            <Eyebrow>The collection</Eyebrow>
            <h2>
              Small atlas.
              <br />
              <em>Extraordinary places.</em>
            </h2>
          </div>
          <div>
            <p>
              Four landscapes. Countless ways to make them yours.
              <br />
              Pick a place that pulls you in. We’ll help you connect the dots.
            </p>
            <Link className="text-link" to="/destinations">
              See every direction <Arrow diagonal />
            </Link>
          </div>
        </div>
        <div className="destination-grid">
          {destinations.map((d, i) => (
            <DestinationCard key={d.id} destination={d} index={i} />
          ))}
        </div>
      </section>
      <section className="atlas-section">
        <div className="atlas-copy" data-rise>
          <Eyebrow>A world worth wandering</Eyebrow>
          <h2>
            Follow your
            <br />
            <em>curiosity.</em>
          </h2>
          <p>No wrong first turn. Choose a point on the globe and start a new chapter.</p>
          <div className="atlas-destinations" aria-label="Choose a globe destination">
            {destinations.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setGlobe(d.id)}
                aria-pressed={globe === d.id}
                className={globe === d.id ? 'active' : ''}
              >
                <span>0{i + 1}</span>
                {d.name}
                <ArrowUpRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="atlas-visual">
          <Globe selected={globe} />
          <div className="atlas-current">
            <span className="tiny-label">Your next chapter</span>
            <Link to={`/destinations/${globe}`}>
              {globeDestination.name} <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="process-illustration" data-rise>
          <div className="route-paper">
            <span className="tiny-label">Your kind of itinerary</span>
            <div className="paper-route">
              <span>01</span>
              <div>
                <strong>A place that stays with you.</strong>
                <small>Start with a little inspiration</small>
              </div>
            </div>
            <div className="paper-route">
              <span>02</span>
              <div>
                <strong>Room to change your mind.</strong>
                <small>Drag, move, make it yours</small>
              </div>
            </div>
            <div className="paper-route">
              <span>03</span>
              <div>
                <strong>Something to look forward to.</strong>
                <small>Keep your next chapter close</small>
              </div>
            </div>
            <CompassMark className="paper-compass" />
          </div>
          <span className="paper-stamp">
            MADE TO WANDER
            <br />
            NOT TO RUSH
          </span>
        </div>
        <div className="process-copy" data-rise>
          <Eyebrow>From daydream to day one</Eyebrow>
          <h2>
            A good plan.
            <br />
            <em>A little serendipity.</em>
          </h2>
          <p>
            Start with a few handpicked places. Rearrange the days, leave yourself a note, and see
            what the budget looks like. The best itinerary is the one that feels like you.
          </p>
          <Link className="button button-dark" to="/planner">
            Build your own chapter <Arrow />
          </Link>
          <p className="small-note">No account. No booking pressure. Just your next idea.</p>
        </div>
      </section>
      <section className="feature-story">
        <img
          src={imagePath('dilijan', 1800)}
          srcSet={`${imagePath('dilijan')} 800w, ${imagePath('dilijan', 1800)} 1800w`}
          sizes="100vw"
          width="1800"
          height="1200"
          loading="lazy"
          alt={photoAlt.dilijan}
          data-parallax
        />
        <div className="feature-story-shade" />
        <div className="feature-story-copy" data-rise>
          <Eyebrow>A little closer to home</Eyebrow>
          <h2>
            Some stories
            <br />
            start <em>in the forest.</em>
          </h2>
          <p>A few days among the trees, lakes and stone monasteries of Dilijan.</p>
          <StartTrip destination={destinations[3]!} label="Find the quiet in Dilijan" />
        </div>
        <span className="feature-story-coordinate">
          DILIJAN, ARMENIA
          <br />
          40.74° N / 44.86° E
        </span>
        <CompassMark className="feature-compass" />
      </section>
    </div>
  );
}
