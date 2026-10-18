import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { destinationById, destinations, imagePath, photoAlt } from '../domain/catalog';
import {
  BookmarkButton,
  Breadcrumb,
  CompassMark,
  DestinationCard,
  Eyebrow,
  StartTrip,
} from '../components/Shared';
import { usePageMotion } from '../components/usePageMotion';
import RouteMap from '../components/RouteMap';
export default function DestinationDetail() {
  const { destinationId } = useParams(),
    destination = destinationById(destinationId),
    root = usePageMotion<HTMLDivElement>(destinationId);
  if (!destination)
    return (
      <div className="empty-state">
        <h1>That direction is outside our atlas.</h1>
        <Link className="button button-dark" to="/destinations">
          Explore the collection
        </Link>
      </div>
    );
  return (
    <div ref={root}>
      <section className="destination-detail-hero">
        <img
          src={imagePath(destination.id, 1800)}
          srcSet={`${imagePath(destination.id)} 800w, ${imagePath(destination.id, 1800)} 1800w`}
          sizes="100vw"
          width="1800"
          height="1200"
          alt={photoAlt[destination.id]}
          fetchPriority="high"
          data-parallax
        />
        <div className="detail-hero-shade" />
        <div className="detail-hero-content">
          <Breadcrumb destinationId={destination.id} />
          <Eyebrow>
            {destination.country} / {destination.region}
          </Eyebrow>
          <h1>{destination.name}</h1>
          <div className="detail-hero-bottom">
            <p>{destination.short}</p>
            <a
              className="round-link"
              href="#destination-story"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById('destination-story')?.scrollIntoView({ block: 'start' });
              }}
              aria-label="Read the destination story"
            >
              <ArrowDown />
            </a>
          </div>
        </div>
        <span className="detail-chapter">{destination.chapter}</span>
      </section>
      <section className="section destination-story" id="destination-story">
        <div data-rise>
          <Eyebrow>Meet your next chapter</Eyebrow>
          <h2>
            {destination.headline.split('\n').map((line, i) => (
              <span key={line}>
                {i ? <em>{line}</em> : line}
                <br />
              </span>
            ))}
          </h2>
        </div>
        <div className="destination-intro-copy" data-rise>
          <p>{destination.intro}</p>
          <div className="tag-row">
            {destination.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="button-row">
            <StartTrip destination={destination} label="Start with a 3-day plan" />
            <BookmarkButton destination={destination} />
          </div>
          <p className="small-note">
            A saved, editable starting point. Add up to 10 days and set your own allowances.
          </p>
        </div>
      </section>
      <section className="section detail-places">
        <div className="section-heading" data-rise>
          <div>
            <Eyebrow>Connect the dots</Eyebrow>
            <h2>
              Places with
              <br />
              <em>a little pull.</em>
            </h2>
          </div>
          <p>
            Seven ideas for your itinerary.
            <br />
            Choose your own order. Leave yourself time.
          </p>
        </div>
        <div className="place-map-layout">
          <div className="detail-place-list">
            {destination.places.map((place, index) => (
              <article key={place.id} className="detail-place-row" data-rise>
                <span className="place-number">0{index + 1}</span>
                <div>
                  <span className="tiny-label">{place.category}</span>
                  <h3>{place.name}</h3>
                  <p>{place.description}</p>
                </div>
                <span className="place-duration">
                  <Clock aria-hidden="true" />
                  {(place.minutes / 60) % 1 === 0
                    ? `${place.minutes / 60}h`
                    : `${Math.floor(place.minutes / 60)}h ${place.minutes % 60}m`}
                  <small>sample stop</small>
                </span>
              </article>
            ))}
          </div>
          <aside className="detail-map-sticky">
            <RouteMap destination={destination} />
            <div className="official-source">
              <MapPin aria-hidden="true" />
              <div>
                <strong>Before you go</strong>
                <p>
                  Check current access, opening times, reservations and local conditions with
                  official destination information.
                </p>
                <a className="text-link" href={destination.source} target="_blank" rel="noreferrer">
                  Official destination guide
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <section className="detail-plan-cta">
        <CompassMark data-turn />
        <div>
          <Eyebrow>Make space for this place</Eyebrow>
          <h2>
            From “one day”
            <br />
            to <em>day one.</em>
          </h2>
        </div>
        <div>
          <p>
            Your first three days are a starting point.
            <br />
            Move things around. Make it personal.
          </p>
          <StartTrip destination={destination} />
        </div>
      </section>
      <section className="section">
        <div className="section-heading" data-rise>
          <div>
            <Eyebrow>Another direction</Eyebrow>
            <h2>
              Keep <em>wandering.</em>
            </h2>
          </div>
          <Link className="text-link" to="/destinations">
            Back to the atlas
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="destination-grid destination-grid-three">
          {destinations
            .filter((d) => d.id !== destination.id)
            .map((d, i) => (
              <DestinationCard key={d.id} destination={d} index={i} />
            ))}
        </div>
      </section>
    </div>
  );
}
