import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { destinations } from '../domain/catalog';
import photos from '../data/photos.json';
import { CompassMark, Eyebrow } from '../components/Shared';
import { usePageMotion } from '../components/usePageMotion';
export default function About() {
  const root = usePageMotion<HTMLDivElement>();
  return (
    <div className="section about-page" ref={root}>
      <div className="page-intro" data-rise>
        <Eyebrow>A note from Tavriqa</Eyebrow>
        <h1>
          Made for
          <br />
          <em>the beautifully curious.</em>
        </h1>
        <div className="intro-bottom">
          <p>
            An independent travel-planning concept
            <br />
            designed and built by Rafayel Karamyan.
          </p>
          <CompassMark />
        </div>
      </div>
      <div className="about-body">
        <section data-rise>
          <span className="tiny-label">01 / The idea</span>
          <h2>
            A little structure.
            <br />
            <em>A lot of possibility.</em>
          </h2>
          <p>
            Tavriqa brings a small destination atlas and a practical itinerary together. Start with
            a landscape that draws you in. Then rearrange the days, add notes and make the budget
            your own.
          </p>
          <p>
            This is a personal portfolio project with sample itineraries and illustrative EUR
            allowances. It is not a travel agency or a booking service. No payments, reservations or
            live availability are involved.
          </p>
          <Link className="text-link" to="/planner">
            Try the trip planner
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>
        <section data-rise>
          <span className="tiny-label">02 / Your plans</span>
          <h2>
            Keep the things
            <br />
            <em>you want to come back to.</em>
          </h2>
          <p>
            Trips and bookmarked destinations stay in this browser. Export a trip file to back it up
            or move it to another device. Shared links contain a snapshot of your trip, including
            its notes; anyone with the link can read it and save a copy.
          </p>
          <p>
            Map pins are approximate. Lines connect places directly and are not road, walking or
            navigation routes. Suggested stop durations exclude travel time. Allowances are editable
            planning examples, not current prices. Flights, insurance and reservations are excluded.
          </p>
          <p>
            Before making travel arrangements, check official access, conditions, opening hours and
            reservations for the places you want to visit.
          </p>
        </section>
        <section data-rise>
          <span className="tiny-label">03 / The people behind the photographs</span>
          <h2>
            Places, through
            <br />
            <em>other people’s eyes.</em>
          </h2>
          <p>
            Photography is used under the{' '}
            <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
              Unsplash License
            </a>
            . The site design, interface and itinerary experience are original to this project.
          </p>
          <div className="credit-list">
            {photos.map((photo) => (
              <a key={photo.id} href={photo.source} target="_blank" rel="noreferrer">
                <span>
                  {destinations.find((d) => d.id === photo.id)!.name}
                  <strong>{photo.author}</strong>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
          <p>
            Globe land geometry:{' '}
            <a
              href="https://www.naturalearthdata.com/about/terms-of-use/"
              target="_blank"
              rel="noreferrer"
            >
              Natural Earth
            </a>
            , public-domain 1:110m land data. The local itinerary map is an authored schematic.
          </p>
        </section>
        <section data-rise>
          <span className="tiny-label">04 / Destination reading</span>
          <h2>
            Go to
            <br />
            <em>the source.</em>
          </h2>
          <div className="credit-list">
            {destinations.map((destination) => (
              <a key={destination.id} href={destination.source} target="_blank" rel="noreferrer">
                <span>
                  {destination.name}
                  <strong>Official destination information</strong>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
