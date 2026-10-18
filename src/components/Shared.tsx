import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowUpRight, Bookmark, Compass, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { destinationById, imagePath, photoAlt, type Destination } from '../domain/catalog';
import { useCollection } from '../state/useCollection';
import { collection } from '../state/repository';
export function CompassMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`compass-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="m32 3 8 21 21 8-21 8-8 21-8-21L3 32l21-8Z" fill="currentColor" />
      <path d="m32 17 5 15-5 15-5-15Z" fill="var(--paper)" />
    </svg>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <ArrowUpRight aria-hidden="true" className={diagonal ? '' : 'straight-arrow'} />;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true" /> {children}
    </p>
  );
}
export function StartTrip({
  destination,
  label = 'Make this trip',
  className = 'button button-orange',
}: {
  destination: Destination;
  label?: string;
  className?: string;
}) {
  const { start, busy } = useCollection(),
    navigate = useNavigate();
  return (
    <button
      className={className}
      disabled={busy}
      onClick={async () => {
        const result = await start(destination.id);
        if (result.ok) void navigate(`/plan/${result.value}`);
      }}
    >
      {label}
      <Arrow />
    </button>
  );
}
export function BookmarkButton({
  destination,
  compact = false,
}: {
  destination: Destination;
  compact?: boolean;
}) {
  const { data, busy, execute } = useCollection(),
    saved = data?.bookmarks.includes(destination.id) ?? false;
  return (
    <button
      className={compact ? 'icon-button bookmark-button' : 'button button-outline'}
      disabled={busy}
      aria-label={`${saved ? 'Unsave' : 'Save'} ${destination.name}`}
      aria-pressed={saved}
      onClick={() =>
        void execute(
          (lease) => collection.bookmark(lease, destination.id),
          saved ? 'Destination removed from saved.' : 'Destination saved.',
        )
      }
    >
      <Bookmark aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
      {!compact && (saved ? 'Saved destination' : 'Save destination')}
    </button>
  );
}
export function DestinationCard({
  destination,
  index = 0,
}: {
  destination: Destination;
  index?: number;
}) {
  return (
    <article className="destination-card" data-rise>
      <div className="destination-card-image">
        <Link to={`/destinations/${destination.id}`} aria-label={`Explore ${destination.name}`}>
          <img
            src={imagePath(destination.id)}
            alt={photoAlt[destination.id]}
            loading="lazy"
            width="800"
            height="1000"
            style={{ objectPosition: destination.imagePosition }}
          />
        </Link>
        <span className="card-index">
          0{index + 1} / {destination.country}
        </span>
        <BookmarkButton destination={destination} compact />
        <span className="card-image-tag">{destination.tags[0]}</span>
      </div>
      <div className="destination-card-copy">
        <div>
          <p className="tiny-label">{destination.region}</p>
          <h3>
            <Link to={`/destinations/${destination.id}`}>{destination.name}</Link>
          </h3>
        </div>
        <Link
          className="round-link"
          to={`/destinations/${destination.id}`}
          aria-label={`View ${destination.name}`}
        >
          <Arrow diagonal />
        </Link>
      </div>
      <p className="card-caption">{destination.short}</p>
    </article>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Compass aria-hidden="true" />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Breadcrumb({ destinationId }: { destinationId?: string }) {
  const destination = destinationById(destinationId);
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span aria-hidden="true">/</span>
      <Link to="/destinations">Destinations</Link>
      {destination && (
        <>
          <span aria-hidden="true">/</span>
          <span>{destination.name}</span>
        </>
      )}
    </nav>
  );
}
