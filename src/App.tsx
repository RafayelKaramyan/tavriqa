import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { CollectionProvider } from './state/CollectionProvider';
import { MotionProvider } from './components/Motion';
import Layout from './components/Layout';
import Home from './pages/Home';
const Destinations = lazy(() => import('./pages/Destinations'));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'));
const Planner = lazy(() => import('./pages/Planner'));
const Trips = lazy(() => import('./pages/Trips'));
const Import = lazy(() => import('./pages/Import'));
const About = lazy(() => import('./pages/About'));
class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state">
        <h1>This chapter could not open.</h1>
        <p>Your saved trips are still in this browser. Reload to try again.</p>
        <button className="button button-dark" onClick={() => window.location.reload()}>
          Reload Tavriqa
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <PageBoundary>
      <MotionProvider>
        <CollectionProvider>
          <Suspense
            fallback={
              <div className="page-loading" role="status">
                Finding the long way…
              </div>
            }
          >
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="destinations" element={<Destinations />} />
                <Route path="destinations/:destinationId" element={<DestinationDetail />} />
                <Route path="planner" element={<Planner />} />
                <Route path="plan/:tripId" element={<Planner />} />
                <Route path="trips" element={<Trips />} />
                <Route path="import" element={<Import />} />
                <Route path="about" element={<About />} />
                <Route
                  path="*"
                  element={
                    <div className="empty-state">
                      <h1>A little off the map.</h1>
                      <p>That page is not here. Your next direction is.</p>
                      <Link className="button button-dark" to="/destinations">
                        Explore destinations
                      </Link>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </CollectionProvider>
      </MotionProvider>
    </PageBoundary>
  );
}
