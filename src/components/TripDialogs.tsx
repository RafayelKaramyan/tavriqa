import { useState } from 'react';
import { Check, Copy, Download, FileJson, FileText, Printer } from 'lucide-react';
import { Dialog } from './Shared';
import { dayDate, money, parseMoney, tripBudget, type Stop, type Trip } from '../domain/trip';
import { download, exportTrip, shareToken, tripText } from '../domain/transfer';
import { destinationById, placeById } from '../domain/catalog';
import { useCollection } from '../state/useCollection';
export function TripSettings({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { command, busy } = useCollection(),
    [title, setTitle] = useState(trip.title),
    [date, setDate] = useState(trip.startDate),
    [travellers, setTravellers] = useState(trip.travellers),
    [error, setError] = useState('');
  return (
    <Dialog title="Make it your trip" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) {
            setError('Give your trip a name.');
            return;
          }
          const result = await command(
            trip.id,
            { type: 'details', title: title.trim(), startDate: date, travellers },
            trip.revision,
          );
          if (result.ok) onClose();
          else setError(result.error);
        }}
      >
        <label className="field-label" htmlFor="trip-title">
          Trip name
          <input
            id="trip-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
            aria-describedby={error ? 'settings-error' : undefined}
          />
        </label>
        <div className="form-two-col">
          <label className="field-label" htmlFor="trip-date">
            First day <span className="optional">optional</span>
            <input
              id="trip-date"
              type="date"
              value={date}
              min="1900-01-01"
              max="9998-12-31"
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="field-label">
            <label htmlFor="trip-travellers">Travellers</label>
            <select
              id="trip-travellers"
              value={travellers}
              onChange={(e) => setTravellers(Number(e.target.value))}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i ? 'travellers' : 'traveller'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="small-note">
          Changing the group size updates the budget. Rooms are estimated at two travellers per
          room.
        </p>
        {error && (
          <p className="field-error" id="settings-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button button-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-dark" disabled={busy} type="submit">
            Save trip details
            <Check aria-hidden="true" />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function BudgetSettings({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { command, busy } = useCollection(),
    [values, setValues] = useState(
      Object.fromEntries(
        Object.entries(trip.budget).map(([key, value]) => [key, (value / 100).toFixed(2)]),
      ) as Record<keyof Trip['budget'], string>,
    ),
    [error, setError] = useState('');
  const fields: [keyof Trip['budget'], string, string][] = [
    ['lodgingCents', 'Stay / room / night', 'Two travellers per room; nights = days minus one.'],
    ['foodCents', 'Food / traveller / day', 'Every traveller, every day.'],
    [
      'transportCents',
      'Transport / group / day',
      'One shared daily allowance for the whole group.',
    ],
    ['limitCents', 'Total trip budget', 'Your total allowance for this trip.'],
  ];
  return (
    <Dialog title="Set your own allowances" onClose={onClose}>
      <p className="dialog-intro">
        All values are in EUR. These are your planning numbers, not live prices or quotes.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const budget = Object.fromEntries(
              Object.entries(values).map(([key, value]) => [key, parseMoney(value)]),
            ) as Trip['budget'];
            const result = await command(trip.id, { type: 'budget-all', budget }, trip.revision);
            if (result.ok) onClose();
            else setError(result.error);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Check each amount.');
          }
        }}
      >
        {fields.map(([field, label, hint]) => (
          <label key={field} className="field-label" htmlFor={`budget-${field}`}>
            {label}
            <span className="money-input">
              <span aria-hidden="true">€</span>
              <input
                id={`budget-${field}`}
                inputMode="decimal"
                value={values[field]}
                onChange={(e) => setValues({ ...values, [field]: e.target.value })}
                required
                aria-describedby={`hint-${field}`}
              />
            </span>
            <small id={`hint-${field}`}>{hint}</small>
          </label>
        ))}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <p className="small-note">
          Place allowances are edited on each stop. Flights, insurance and reservations are
          excluded.
        </p>
        <div className="dialog-actions">
          <button className="button button-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-dark" type="submit" disabled={busy}>
            Save allowances
            <Check aria-hidden="true" />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function StopSettings({
  trip,
  stop,
  onClose,
}: {
  trip: Trip;
  stop: Stop;
  onClose: () => void;
}) {
  const { command, busy } = useCollection(),
    [notes, setNotes] = useState(stop.notes),
    [amount, setAmount] = useState((stop.allowanceCents / 100).toFixed(2)),
    [error, setError] = useState('');
  const place = placeById(trip.destinationId, stop.placeId)!;
  return (
    <Dialog title={place.name} onClose={onClose}>
      <p className="dialog-intro">{place.description}</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const allowanceCents = parseMoney(amount);
            const result = await command(
              trip.id,
              { type: 'stop-details', stopId: stop.id, notes, allowanceCents },
              trip.revision,
            );
            if (result.ok) onClose();
            else setError(result.error);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Check the amount.');
          }
        }}
      >
        <label className="field-label" htmlFor="stop-notes">
          A note for later
          <textarea
            id="stop-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={240}
            rows={4}
            placeholder="A little thing to remember…"
          />
          <small>{notes.length}/240 characters</small>
        </label>
        <label className="field-label" htmlFor="stop-allowance">
          Place allowance / traveller
          <span className="money-input">
            <span aria-hidden="true">€</span>
            <input
              id="stop-allowance"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </span>
          <small>Your own estimate, separate from food and transport.</small>
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button button-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-dark" type="submit" disabled={busy}>
            Save place details
            <Check aria-hidden="true" />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function ShareTrip({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState('');
  let url = '',
    problem = '';
  try {
    url = `${window.location.origin}${window.location.pathname}#/import?trip=${shareToken(trip)}`;
  } catch (cause) {
    problem = cause instanceof Error ? cause.message : 'This trip could not be shared.';
  }
  return (
    <Dialog title="Send a little inspiration" onClose={onClose}>
      <p className="dialog-intro">
        This link carries a snapshot of your itinerary, notes and allowances. Anyone with it can
        preview and save their own copy. Later edits stay in your trip.
      </p>
      {problem ? (
        <p role="alert" className="field-error">
          {problem}
        </p>
      ) : (
        <>
          <label className="field-label" htmlFor="share-link">
            Trip link
            <textarea
              id="share-link"
              rows={3}
              value={url}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <button
            className="button button-dark"
            onClick={async () => {
              try {
                if (!navigator.clipboard) throw new Error();
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setError('');
              } catch {
                setError(
                  'Automatic copy is unavailable. Select the link above and copy it manually.',
                );
              }
            }}
          >
            {copied ? 'Link copied' : 'Copy trip link'}
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
          {copied && (
            <p className="small-note" role="status">
              Copied. Your friend can save a separate copy.
            </p>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}
export function ExportTrip({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  return (
    <Dialog title="Take your plans with you" onClose={onClose}>
      <p className="dialog-intro">
        Export a portable backup, keep a simple text copy, or print your itinerary.
      </p>
      <div className="export-options">
        <button
          onClick={() =>
            download(
              JSON.stringify(exportTrip(trip), null, 2),
              'tavriqa-trip.json',
              'application/json',
            )
          }
        >
          <FileJson aria-hidden="true" />
          <span>
            <strong>Trip file</strong>
            <small>JSON · import it back into Tavriqa</small>
          </span>
          <Download aria-hidden="true" />
        </button>
        <button onClick={() => download(tripText(trip), 'tavriqa-itinerary.txt')}>
          <FileText aria-hidden="true" />
          <span>
            <strong>Plain-text itinerary</strong>
            <small>Places, notes and your budget</small>
          </span>
          <Download aria-hidden="true" />
        </button>
        <button
          onClick={() => {
            onClose();
            requestAnimationFrame(() => window.print());
          }}
        >
          <Printer aria-hidden="true" />
          <span>
            <strong>Print / Save as PDF</strong>
            <small>Use your browser’s print dialog</small>
          </span>
        </button>
      </div>
    </Dialog>
  );
}
export function PrintableTrip({ trip }: { trip: Trip }) {
  const destination = destinationById(trip.destinationId)!,
    budget = tripBudget(trip);
  return (
    <section className="printable-trip">
      <h1>{trip.title}</h1>
      <p>
        {destination.name}, {destination.country} · {trip.travellers} travellers
      </p>
      {trip.days.map((day, index) => (
        <div key={day.id}>
          <h2>
            Day {index + 1}
            {dayDate(trip.startDate, index) && ` · ${dayDate(trip.startDate, index)}`}
          </h2>
          <ol>
            {day.stops.map((stop) => (
              <li key={stop.id}>
                <strong>{placeById(trip.destinationId, stop.placeId)!.name}</strong>
                {stop.notes && <p>{stop.notes}</p>}
                <p>Place allowance: {money(stop.allowanceCents)} / traveller</p>
              </li>
            ))}
          </ol>
          {!day.stops.length && <p>A little room for the unexpected.</p>}
        </div>
      ))}
      <h2>Planning estimate</h2>
      <p>
        Stay: {money(budget.lodging)} · Food: {money(budget.food)} · Transport:{' '}
        {money(budget.transport)} · Places: {money(budget.activities)}
      </p>
      <p>
        Total: {money(budget.total)} / {money(budget.perPerson)} per traveller · Budget limit:{' '}
        {money(trip.budget.limitCents)}
      </p>
      <p>
        Sample EUR allowances, not quotes. Flights and insurance excluded. Map locations are
        approximate and do not represent navigation routes. Check official destination access and
        conditions.
      </p>
      <p>{destination.source}</p>
      <p>Tavriqa · https://rafayelkaramyan.github.io/tavriqa/</p>
    </section>
  );
}
