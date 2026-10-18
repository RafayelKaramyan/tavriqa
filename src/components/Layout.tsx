import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Pause, Play, X } from 'lucide-react';
import { useCollection } from '../state/useCollection';
import { destinationById } from '../domain/catalog';
import { collection, collectionLock } from '../state/repository';
import { download } from '../domain/transfer';
import { CompassMark, Dialog } from './Shared';
import { useMotion } from './useMotion';

export default function Layout() {
  const { pathname } = useLocation(),
    { view, data, error, notice, dismiss } = useCollection(),
    { reduced, systemReduced, toggle } = useMotion();
  const [menu, setMenu] = useState(false),
    [reset, setReset] = useState(false),
    [resetError, setResetError] = useState('');
  const isHome = pathname === '/',
    count = data?.trips.length ?? 0;
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const destination = destinationById(pathname.split('/')[2]);
    const title =
      pathname === '/'
        ? 'Take the long way'
        : destination
          ? destination.name
          : pathname === '/trips'
            ? 'Your saved trips'
            : pathname === '/import'
              ? 'A shared itinerary'
              : pathname === '/about'
                ? 'About & credits'
                : pathname === '/destinations'
                  ? 'The destination atlas'
                  : 'Your trip planner';
    document.title = `${title} — Tavriqa`;
    window.scrollTo(0, 0);
    if (previousPath.current !== pathname)
      document.getElementById('main')?.focus({ preventScroll: true });
    previousPath.current = pathname;
  }, [pathname]);
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById('main');
          target?.focus({ preventScroll: true });
          target?.scrollIntoView({ block: 'start' });
        }}
      >
        Skip to content
      </a>
      <header className={`site-header ${isHome ? 'header-over-image' : ''}`}>
        <Link to="/" className="wordmark" aria-label="Tavriqa home" onClick={() => setMenu(false)}>
          <CompassMark />
          tavriqa<span className="wordmark-dot">.</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/destinations">Destinations</NavLink>
          <NavLink to="/planner">Trip planner</NavLink>
          <NavLink to="/trips">
            My trips <span className="nav-count">{count}</span>
          </NavLink>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button motion-button"
            disabled={systemReduced}
            aria-label={reduced ? 'Resume decorative motion' : 'Pause decorative motion'}
            aria-pressed={reduced}
            title={
              systemReduced
                ? 'Reduced motion follows your device preference'
                : reduced
                  ? 'Resume motion'
                  : 'Pause motion'
            }
            onClick={toggle}
          >
            {reduced ? <Play /> : <Pause />}
          </button>
          <Link className="button header-cta" to="/planner">
            Find your way <ArrowUpRight aria-hidden="true" />
          </Link>
          <button
            className="icon-button menu-button"
            aria-label={menu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menu && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
          <NavLink onClick={() => setMenu(false)} to="/destinations">
            Destinations
            <ArrowUpRight />
          </NavLink>
          <NavLink onClick={() => setMenu(false)} to="/planner">
            Trip planner
            <ArrowUpRight />
          </NavLink>
          <NavLink onClick={() => setMenu(false)} to="/trips">
            My trips ({count})<ArrowUpRight />
          </NavLink>
        </nav>
      )}
      <main id="main" tabIndex={-1} className={isHome ? 'main-home' : ''}>
        {view.kind !== 'ready' && (
          <aside className="recovery-banner" aria-label="Saved collection needs attention">
            <div>
              <strong>Let’s keep your plans safe.</strong>
              <p>{view.message}</p>
            </div>
            {view.kind === 'corrupt' && (
              <div className="button-row">
                <button
                  className="button button-small button-outline"
                  onClick={() => download(view.raw, 'tavriqa-recovery.txt')}
                >
                  Export original data
                </button>
                <button className="text-button" onClick={() => setReset(true)}>
                  Reset collection
                </button>
              </div>
            )}
          </aside>
        )}
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <p>
            Leave room
            <br />
            for <em>the unexpected.</em>
          </p>
          <Link to="/planner" className="footer-arrow" aria-label="Start your next trip">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="footer-bottom">
          <Link to="/" className="wordmark">
            <CompassMark />
            tavriqa
          </Link>
          <p>
            A travel-planning portfolio by{' '}
            <a href="https://github.com/RafayelKaramyan" target="_blank" rel="noreferrer">
              Rafayel Karamyan
            </a>
            .<br />
            Sample trips & allowances. Your plans stay in this browser.
          </p>
          <div>
            <Link to="/about">About & credits</Link>
            <a href="https://github.com/RafayelKaramyan/tavriqa" target="_blank" rel="noreferrer">
              View source <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <span className="footer-coordinate">40.74° N / 44.86° E</span>
        </div>
      </footer>
      {(error || notice) && (
        <div className={`feedback ${error ? 'feedback-error' : ''}`}>
          <p role={error ? 'alert' : 'status'}>{error || notice}</p>
          <button className="icon-button" aria-label="Dismiss message" onClick={dismiss}>
            <X />
          </button>
        </div>
      )}
      {reset && view.kind === 'corrupt' && (
        <Dialog title="Reset your collection?" onClose={() => setReset(false)}>
          <p>
            This removes the unreadable collection and all its saved trips. Export the original data
            first if you want to keep a copy.
          </p>
          {resetError && (
            <p role="alert" className="field-error">
              {resetError}
            </p>
          )}
          <div className="button-row">
            <button className="button button-outline" onClick={() => setReset(false)}>
              Keep original data
            </button>
            <button
              className="button button-danger"
              onClick={async () => {
                try {
                  await collectionLock(() => collection.reset(view.raw));
                  setReset(false);
                } catch (cause) {
                  setResetError(cause instanceof Error ? cause.message : 'Reset failed.');
                }
              }}
            >
              Reset saved collection
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
