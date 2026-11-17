import { supabase } from './supabase';
import { addDays, dayKey, longDate, longDay, rupiah, runtime, subtitleText, time } from './format';

export type TicketStatus =
  | 'announced' | 'on_sale_soon' | 'on_sale' | 'few_left' | 'sold_out'
  | 'free_rsvp' | 'walk_in' | 'cancelled';
export type EventKind = 'festival' | 'series' | 'one_off';

export interface Film {
  slug: string;
  title: string;
  original_title: string | null;
  year: number | null;
  directors: string[] | null;
  runtime_min: number | null;
  poster_url: string | null;
}

export interface Venue {
  slug: string;
  name: string;
  area: string | null;
}

export interface EventInfo {
  slug: string;
  name: string;
  kind: EventKind;
  start_date: string | null;
  end_date: string | null;
  summary: string | null;
  official_url: string | null;
}

export interface Screening {
  id: string;
  starts_at: string;
  screen: string | null;
  subtitles: string | null;
  price_idr: number | null;
  ticket_status: TicketStatus;
  ticket_url: string | null;
  tickets_on_sale_at: string | null;
  guest_note: string | null;
  featured_until: string | null;
  film: Film | null;
  venue: Venue | null;
  event: EventInfo | null;
}

export interface Post {
  slug: string;
  kind: string;
  title: string;
  dek: string | null;
  cover_url: string | null;
  author: string | null;
  published_at: string;
}

/** A screening flattened for display and for passing to React islands. */
export interface Listing {
  id: string;
  day: string; // YYYY-MM-DD, Jakarta
  startsAt: string;
  time: string;
  title: string;
  filmSlug: string | null;
  posterUrl: string | null;
  meta: string; // director · runtime · subtitles
  where: string; // venue, screen
  eventName: string | null;
  eventKind: EventKind | null;
  area: string | null;
  status: TicketStatus;
  ticketUrl: string | null;
  subtitles: 'en' | 'id' | 'other' | null;
  free: boolean;
  guest: boolean;
}

const SCREENING_FIELDS = `
  id, starts_at, screen, subtitles, price_idr, ticket_status, ticket_url,
  tickets_on_sale_at, guest_note, featured_until,
  film:films ( slug, title, original_title, year, directors, runtime_min, poster_url ),
  venue:venues ( slug, name, area ),
  event:events ( slug, name, kind, start_date, end_date, summary, official_url )
`;

// Embedded rows can come back as an object or a one-item array depending on
// how PostgREST reads the foreign key; normalise to an object.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/** Screenings from `daysBack` days ago onward, oldest first. Never throws. */
export async function getScreenings(daysBack = 60): Promise<Screening[]> {
  const from = new Date(Date.now() - daysBack * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('screenings')
    .select(SCREENING_FIELDS)
    .gte('starts_at', from)
    .neq('ticket_status', 'cancelled')
    .order('starts_at', { ascending: true })
    .limit(2000);
  if (error) {
    console.warn('[supabase] screenings:', error.message);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    ...row,
    film: one(row.film),
    venue: one(row.venue),
    event: one(row.event),
  })) as Screening[];
}

export async function getEvents(): Promise<EventInfo[]> {
  const { data, error } = await supabase
    .from('events')
    .select('slug, name, kind, start_date, end_date, summary, official_url, featured_until')
    .order('start_date', { ascending: true });
  if (error) {
    console.warn('[supabase] events:', error.message);
    return [];
  }
  return (data ?? []) as EventInfo[];
}

export async function getPosts(limit = 6): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug, kind, title, dek, cover_url, author, published_at')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[supabase] posts:', error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

function subtitleCode(s: string | null): Listing['subtitles'] {
  if (!s) return null;
  if (/^(en|english)/i.test(s.trim())) return 'en';
  if (/^(id|indonesian|bahasa)/i.test(s.trim())) return 'id';
  return /^none$/i.test(s.trim()) ? null : 'other';
}

export function toListing(s: Screening): Listing {
  const film = s.film;
  const directors = film?.directors?.filter(Boolean).join(', ') || null;
  const meta = [directors, runtime(film?.runtime_min), subtitleText(s.subtitles)].filter(Boolean).join(' · ');
  const where = [s.venue?.name, s.screen].filter(Boolean).join(', ');
  return {
    id: s.id,
    day: dayKey(s.starts_at),
    startsAt: s.starts_at,
    time: time(s.starts_at),
    title: film?.title ?? 'Untitled',
    filmSlug: film?.slug ?? null,
    posterUrl: film?.poster_url ?? null,
    meta,
    where,
    eventName: s.event?.name ?? null,
    eventKind: s.event?.kind ?? null,
    area: s.venue?.area ?? null,
    status: s.ticket_status,
    ticketUrl: s.ticket_url || s.event?.official_url || null,
    subtitles: subtitleCode(s.subtitles),
    free: s.price_idr === 0 || s.ticket_status === 'free_rsvp',
    guest: Boolean(s.guest_note),
  };
}

/** Status words, shown only when they change what a reader does. */
export function statusLabel(st: TicketStatus): string | null {
  if (st === 'few_left') return 'Few left';
  if (st === 'sold_out') return 'Sold out';
  return null;
}

// ---------------------------------------------------------------------------
// Hero: the biggest highlight right now, in priority order.

export interface Slide {
  kicker: string;
  title: string;
  line: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  countdownTo?: string; // ISO time; the hero counts down to it on the client
  image?: string | null;
  bg: string;
}

const isLive = (e: EventInfo, today: string) =>
  !!e.start_date && e.start_date <= today && (!e.end_date || e.end_date >= today);

function dayOf(e: EventInfo, today: string): string | null {
  if (!e.start_date || !e.end_date) return null;
  const n = (a: string) => new Date(a + 'T00:00:00Z').getTime() / 86400_000;
  return `day ${n(today) - n(e.start_date) + 1} of ${n(e.end_date) - n(e.start_date) + 1}`;
}

export function buildSlides(events: EventInfo[], screenings: Screening[], now = new Date()): Slide[] {
  const today = dayKey(now);
  const slides: Slide[] = [];
  const seen = new Set<string>();
  const posterFor = (slug: string) =>
    screenings.find((s) => s.event?.slug === slug && s.film?.poster_url)?.film?.poster_url ?? null;

  // 1. Ticket sales opening in the next 48 hours.
  const soon = screenings
    .filter((s) => s.tickets_on_sale_at)
    .filter((s) => {
      const t = new Date(s.tickets_on_sale_at!).getTime() - now.getTime();
      return t > 0 && t < 48 * 3600_000;
    });
  for (const s of soon) {
    const key = s.event?.slug ?? s.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const at = new Date(s.tickets_on_sale_at!);
    const atDay = dayKey(at);
    const when = atDay === today ? 'today' : atDay === addDays(today, 1) ? 'tomorrow' : longDay(atDay);
    slides.push({
      kicker: `Tickets go on sale ${when}, ${time(at)}`,
      title: s.event?.name ?? s.film?.title ?? 'Tickets',
      line: [s.venue?.name, rupiah(s.price_idr)].filter(Boolean).join(' · '),
      cta: { label: 'Buying tickets', href: s.ticket_url || s.event?.official_url || '/whats-on' },
      cta2: { label: 'Schedule', href: '/whats-on' },
      countdownTo: s.tickets_on_sale_at!,
      image: s.film?.poster_url,
      bg: '#1A1C1F',
    });
  }

  // 2. Festivals on now.
  for (const e of events.filter((e) => e.kind === 'festival' && isLive(e, today))) {
    if (seen.has(e.slug)) continue;
    seen.add(e.slug);
    slides.push({
      kicker: `On now, ${dayOf(e, today) ?? 'this week'}`,
      title: e.name,
      line: e.summary ?? `Until ${longDate(e.end_date!)}.`,
      cta: { label: "Today's schedule", href: '/whats-on' },
      cta2: e.official_url ? { label: 'Festival site', href: e.official_url } : undefined,
      image: posterFor(e.slug),
      bg: '#1E1B17',
    });
  }

  // 3. One-night specials and editor's picks.
  const picks = screenings.filter(
    (s) => s.starts_at > now.toISOString() &&
      ((s.featured_until && s.featured_until > now.toISOString()) || s.event?.kind === 'one_off'),
  );
  for (const s of picks.slice(0, 2)) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    const oneOff = s.event?.kind === 'one_off';
    slides.push({
      kicker: oneOff ? 'One night only' : "Editor's pick",
      title: s.guest_note ? `${s.film?.title}, with ${s.guest_note}` : s.film?.title ?? 'Screening',
      line: `${longDate(dayKey(s.starts_at))}, ${time(s.starts_at)} at ${s.venue?.name ?? 'venue to be confirmed'}.`,
      cta: { label: 'Tickets', href: s.ticket_url || '/whats-on' },
      cta2: { label: 'Schedule', href: '/whats-on' },
      image: s.film?.poster_url,
      bg: '#1F1918',
    });
  }

  // 4. Festivals starting within 30 days.
  for (const e of events.filter((e) => e.kind === 'festival' && e.start_date && e.start_date > today && e.start_date <= addDays(today, 30))) {
    if (seen.has(e.slug)) continue;
    seen.add(e.slug);
    slides.push({
      kicker: `Starts ${longDate(e.start_date!)}`,
      title: e.name,
      line: e.summary ?? (e.end_date ? `${longDate(e.start_date!)} to ${longDate(e.end_date)}.` : ''),
      cta: { label: 'Lineup', href: '/whats-on' },
      cta2: e.official_url ? { label: 'Festival site', href: e.official_url } : undefined,
      image: posterFor(e.slug),
      bg: '#1C1A1F',
    });
  }

  // 5. Running series, such as CGV Arthouse.
  for (const e of events.filter((e) => e.kind === 'series' && isLive(e, today))) {
    if (seen.has(e.slug)) continue;
    seen.add(e.slug);
    const next = screenings.find((s) => s.event?.slug === e.slug && s.starts_at > now.toISOString());
    slides.push({
      kicker: next?.film ? `${e.name} this week` : 'Every week',
      title: next?.film?.title ?? e.name,
      line: e.summary ?? '',
      cta: { label: 'Showtimes', href: '/whats-on' },
      cta2: e.official_url ? { label: 'Details', href: e.official_url } : undefined,
      image: next?.film?.poster_url ?? posterFor(e.slug),
      bg: '#1C1C17',
    });
  }

  // Quiet weeks: the site's own standing items.
  if (slides.length < 2) {
    slides.push({
      kicker: 'Special screenings in Jakarta',
      title: 'Every special screening, in one calendar.',
      line: 'Festivals, retrospectives and one-night events. Cinemas list them under codes, or not at all. We list them with ticket dates.',
      cta: { label: "What's On", href: '/whats-on' },
      cta2: { label: 'Submit a screening', href: '/submit' },
      bg: '#1E1B17',
    });
  }
  if (slides.length < 2) {
    slides.push({
      kicker: 'Organizing a screening?',
      title: 'Send it to us.',
      line: 'Festivals, cultural centres, film clubs and one-night events. We list them for free.',
      cta: { label: 'Submit a screening', href: '/submit' },
      bg: '#1A1C1F',
    });
  }
  return slides.slice(0, 4);
}

