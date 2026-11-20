// All dates are shown in Jakarta time, whatever the visitor's or builder's clock says.
export const TZ = 'Asia/Jakarta';
const LOCALE = 'en-GB';

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const longDayFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const shortDayFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: 'short', day: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: 'short' });
const dayNumFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: 'numeric' });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: 'numeric', month: 'long' });

/** YYYY-MM-DD in Jakarta. */
export function dayKey(d: Date | string): string {
  return dayKeyFmt.format(new Date(d));
}

/** Noon of a YYYY-MM-DD key in Jakarta (UTC+7, no DST), safe for formatting. */
export function keyToDate(key: string): Date {
  return new Date(`${key}T12:00:00+07:00`);
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}

/** 0 = Sunday … 6 = Saturday, for a day key. */
export function weekday(key: string): number {
  return keyToDate(key).getUTCDay();
}

export const time = (d: Date | string) => timeFmt.format(new Date(d));
export const longDay = (key: string) => longDayFmt.format(keyToDate(key)).replace(',', '');
export const shortDay = (key: string) => shortDayFmt.format(keyToDate(key)).replace(',', '');
export const weekdayShort = (key: string) => weekdayFmt.format(keyToDate(key));
export const dayNum = (key: string) => dayNumFmt.format(keyToDate(key));
export const longDate = (key: string) => dateFmt.format(keyToDate(key));

/** 100 → "1h 40m", 121 → "2h 01m". */
export function runtime(min: number | null | undefined): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** 35000 → "Rp35.000". */
export function rupiah(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n === 0) return 'Free';
  return 'Rp' + n.toLocaleString('id-ID');
}

/** "1d 02h 14m" until a moment, or null once it has passed. */
export function countdown(to: Date | string, now: Date = new Date()): string | null {
  let s = Math.floor((new Date(to).getTime() - now.getTime()) / 1000);
  if (s <= 0) return null;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return d ? `${d}d ${hh}h ${mm}m` : `${hh}h ${mm}m`;
}

/** "Indonesian subtitles", or null when there are none listed. */
export function subtitleText(s: string | null | undefined): string | null {
  if (!s) return null;
  const v = s.trim();
  if (!v || /^none$/i.test(v)) return null;
  if (/^(en|english)$/i.test(v)) return 'English subtitles';
  if (/^(id|indonesian|bahasa indonesia)$/i.test(v)) return 'Indonesian subtitles';
  return /subtitle/i.test(v) ? v : `${v} subtitles`;
}

/** A dark, quiet tone per title, used where there is no poster image yet. */
const TONES = ['#2B2620', '#22282A', '#2A2422', '#24232A', '#2A2A22', '#1E1E1E', '#2C2321', '#22262A', '#252A24', '#28252D'];
export function tone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
