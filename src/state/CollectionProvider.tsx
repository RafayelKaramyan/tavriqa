import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { collection, collectionLock, type Lease } from './repository';
import { createTrip } from '../domain/trip';
import type { DestinationId } from '../domain/catalog';
import { CollectionContext, type Result } from './useCollection';
export function CollectionProvider({ children }: { children: ReactNode }) {
  const view = useSyncExternalStore(collection.subscribe, collection.snapshot);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  async function execute<T>(action: (lease: Lease) => T, message = ''): Promise<Result<T>> {
    if (busy) return { ok: false, error: 'Wait for the current change to finish saving.' };
    const snapshot = collection.snapshot();
    if (snapshot.kind !== 'ready') {
      setError(snapshot.message);
      return { ok: false, error: snapshot.message };
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const value = await collectionLock(() => action(snapshot.data));
      setNotice(message);
      return { ok: true, value };
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'This change could not be saved. Try again.';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setBusy(false);
    }
  }
  async function start(id: DestinationId): Promise<Result<string>> {
    const trip = createTrip(id),
      result = await execute(
        (lease) => collection.add(lease, trip),
        'Your trip is saved. Make it your own.',
      );
    return result.ok ? { ok: true, value: trip.id } : result;
  }
  return (
    <CollectionContext
      value={{
        view,
        data: view.kind === 'ready' ? view.data : null,
        busy,
        error,
        notice,
        dismiss: () => {
          setError('');
          setNotice('');
        },
        execute,
        start,
        command: (id, command, revision) =>
          execute((lease) => collection.command(lease, id, command, revision), 'Changes saved.'),
      }}
    >
      {children}
    </CollectionContext>
  );
}
