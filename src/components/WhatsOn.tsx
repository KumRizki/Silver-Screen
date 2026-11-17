import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Icon from './Icon';
import type { Listing } from '../lib/data';
import { addDays, dayKey, dayNum, longDay, weekday, weekdayShort } from '../lib/format';

type Range = 'today' | 'weekend' | 'week' | 'all';

interface Props {
  listings: Listing[];
  /** Jakarta day the page was built; replaced by the visitor's real day after load. */
  builtOn: string;
}

const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'week', label: 'Week' },
  { id: 'all', label: 'All upcoming' },
];

const KINDS = [
  { id: 'festival', label: 'Festivals' },
  { id: 'series', label: 'Series and retrospectives' },
  { id: 'one_off', label: 'One-off screenings' },
] as const;

function daysIn(range: Range, today: string): ((d: string) => boolean) {
  if (range === 'today') return (d) => d === today;
  if (range === 'week') { const end = addDays(today, 6); return (d) => d >= today && d <= end; }
  if (range === 'weekend') {
    const toSunday = (7 - weekday(today)) % 7; // 0 when today is Sunday
    const end = addDays(today, toSunday);
    return (d) => d >= today && d <= end && [5, 6, 0].includes(weekday(d));
  }
  return (d) => d >= today;
}

function group(list: Listing[]): [string, Listing[]][] {
  const m = new Map<string, Listing[]>();
  for (const l of list) {
    if (!m.has(l.day)) m.set(l.day, []);
    m.get(l.day)!.push(l);
  }
  return [...m.entries()];
}

function Row({ l, past = false }: { l: Listing; past?: boolean }) {
  const out = l.status === 'sold_out';
  const status = l.status === 'few_left' ? <span className="st st-few">Few left</span>
    : out ? <span className="st st-out">Sold out</span> : null;
  let action: ReactNode = null;
  if (!out && !past) {
    if (l.ticketUrl) {
      action = (
        <a href={l.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-o">
          {l.status === 'free_rsvp' ? 'RSVP' : 'Tickets'}<Icon name="ext" />
        </a>
      );
    } else if (l.status === 'walk_in') {
      action = <span className="t-small">Walk-in</span>;
    }
  }
  return (
    <div id={`s-${l.id}`} className={'r r-screen' + (out || past ? ' dim' : '')}>
      <span className="t-time">{l.time}</span>
      <div>
        {l.eventName && <p className="t-small" style={{ marginBottom: 4 }}>{l.eventName}</p>}
        <p className="t-title">{l.title}</p>
        {l.meta && <p className="t-meta">{l.meta}</p>}
      </div>
      <span className="r-where" style={{ fontSize: 15 }}>{l.where}</span>
      <span className="r-status">{status}</span>
      <span className="r-action">{action}</span>
    </div>
  );
}

export default function WhatsOn({ listings, builtOn }: Props) {
  const [today, setToday] = useState(builtOn);
  const [range, setRange] = useState<Range>('week');
  const [subs, setSubs] = useState<Set<string>>(new Set());
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [free, setFree] = useState(false);
  const [guest, setGuest] = useState(false);
  const [hideOut, setHideOut] = useState(false);

  useEffect(() => { setToday(dayKey(new Date())); }, []);

  const areaList = useMemo(
    () => [...new Set(listings.map((l) => l.area).filter((a): a is string => !!a))].sort(),
    [listings],
  );

  const passes = (l: Listing) =>
    (!subs.size || (l.subtitles != null && subs.has(l.subtitles))) &&
    (!kinds.size || (l.eventKind != null && kinds.has(l.eventKind))) &&
    (!areas.size || (l.area != null && areas.has(l.area))) &&
    (!free || l.free) &&
    (!guest || l.guest) &&
    (!hideOut || l.status !== 'sold_out');

  const upcoming = listings.filter((l) => l.day >= today);
  const inRange = daysIn(range, today);
  const shown = upcoming.filter((l) => inRange(l.day) && passes(l));
  const days = group(shown);
  const recent = group(listings.filter((l) => l.day < today)).slice(-2);

  const strip = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const has = new Set(shown.map((l) => l.day));

  const filtersOn = subs.size + kinds.size + areas.size + Number(free) + Number(guest) + Number(hideOut) > 0;
  const clear = () => { setSubs(new Set()); setKinds(new Set()); setAreas(new Set()); setFree(false); setGuest(false); setHideOut(false); };
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };
  const jump = (d: string) => document.getElementById(`d-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <section className="wrap page-head">
        <div>
          <h1 className="t-h1">What's On</h1>
          <p className="t-lead" style={{ marginTop: 12 }}>Special screenings in Jakarta, by day.</p>
        </div>
        <div className="seg" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </section>

      <div className="wrap s39">
        <aside className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 28 }} aria-label="Filters">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Filters</p>
            {filtersOn && <button type="button" className="u t-small" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={clear}>Clear</button>}
          </div>
          {areaList.length > 0 && (
            <fieldset className="filters">
              <legend>Area</legend>
              {areaList.map((a) => (
                <label key={a} className="check"><input type="checkbox" checked={areas.has(a)} onChange={() => toggle(areas, setAreas, a)} /> {a}</label>
              ))}
            </fieldset>
          )}
          <fieldset className="filters">
            <legend>Programme</legend>
            {KINDS.map((k) => (
              <label key={k.id} className="check"><input type="checkbox" checked={kinds.has(k.id)} onChange={() => toggle(kinds, setKinds, k.id)} /> {k.label}</label>
            ))}
          </fieldset>
          <fieldset className="filters">
            <legend>Subtitles</legend>
            <label className="check"><input type="checkbox" checked={subs.has('en')} onChange={() => toggle(subs, setSubs, 'en')} /> English</label>
            <label className="check"><input type="checkbox" checked={subs.has('id')} onChange={() => toggle(subs, setSubs, 'id')} /> Indonesian</label>
          </fieldset>
          <fieldset className="filters">
            <legend>Other</legend>
            <label className="check"><input type="checkbox" checked={free} onChange={() => setFree(!free)} /> Free</label>
            <label className="check"><input type="checkbox" checked={guest} onChange={() => setGuest(!guest)} /> Q&amp;A or guest</label>
            <label className="check"><input type="checkbox" checked={hideOut} onChange={() => setHideOut(!hideOut)} /> Hide sold out</label>
          </fieldset>
        </aside>

        <div style={{ minWidth: 0 }}>
          <div className="seg days" role="group" aria-label="Jump to day">
            {strip.map((d) => (
              <button key={d} type="button" disabled={!has.has(d)} aria-pressed={false} onClick={() => jump(d)} aria-label={longDay(d)}>
                <span>{weekdayShort(d)}</span><span>{dayNum(d)}</span>
              </button>
            ))}
          </div>

          {days.map(([d, list]) => (
            <section key={d} id={`d-${d}`} className="day-block" style={{ scrollMarginTop: 24 }}>
              <h2 className="t-h2">{d === today ? `Today, ${longDay(d)}` : longDay(d)}</h2>
              <div className="rows">{list.map((l) => <Row key={l.id} l={l} />)}</div>
            </section>
          ))}

          {!days.length && (
            <div className="day-block">
              <div className="empty">
                {upcoming.length ? (
                  <>
                    <p className="t-h3">Nothing matches in this range.</p>
                    <p className="t-body" style={{ marginTop: 12 }}>There are {upcoming.length} upcoming screenings in total.</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                      {range !== 'all' && <button type="button" className="btn btn-o" onClick={() => setRange('all')}>Show all upcoming</button>}
                      {filtersOn && <button type="button" className="btn btn-o" onClick={clear}>Clear filters</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="t-h3">No screenings listed for the coming days yet.</p>
                    <p className="t-body" style={{ marginTop: 12, maxWidth: 560 }}>
                      Festivals and cultural centres often announce only a week or two ahead. Organizing one? <a href="/submit" className="u">Send it to us</a>.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {!upcoming.length && recent.map(([d, list]) => (
            <section key={d} className="day-block">
              <p className="label">Recently shown</p>
              <h2 className="t-h2">{longDay(d)}</h2>
              <div className="rows">{list.map((l) => <Row key={l.id} l={l} past />)}</div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
