import { createContext, useContext } from 'react';
import type { Collection, CollectionView, Lease } from './repository';
import type { TripCommand } from '../domain/trip';
import type { DestinationId } from '../domain/catalog';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
interface CollectionContextValue {
  view: CollectionView;
  data: Collection | null;
  busy: boolean;
  error: string;
  notice: string;
  dismiss: () => void;
  execute: <T>(action: (lease: Lease) => T, message?: string) => Promise<Result<T>>;
  start: (id: DestinationId) => Promise<Result<string>>;
  command: (
    id: string,
    command: TripCommand,
    expectedRevision?: number,
  ) => Promise<Result<Collection>>;
}
export const CollectionContext = createContext<CollectionContextValue | null>(null);
export function useCollection() {
  const context = useContext(CollectionContext);
  if (!context) throw new Error('Collection provider is missing.');
  return context;
}
