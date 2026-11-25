import { useEffect, useState } from 'react';
import Icon from './Icon';
import type { Slide } from '../lib/data';
import { countdown } from '../lib/format';

interface Props {
  slides: Slide[];
  seconds?: number;
}

const isExternal = (href: string) => /^https?:\/\//.test(href);
const linkProps = (href: string) =>
  isExternal(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };

export default function Hero({ slides, seconds = 7 }: Props) {
  const n = slides.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Autoplay, paused on hover, keyboard focus, or reduced-motion preference.
  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % n), seconds * 1000);
    return () => window.clearTimeout(t);
  }, [idx, paused, n, seconds, reduced]);

  const cur = slides[idx];

  // Countdown runs on the client only, so the static HTML never shows a stale time.
  useEffect(() => {
    if (!cur?.countdownTo) { setLeft(null); return; }
    const tick = () => setLeft(countdown(cur.countdownTo!));
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => window.clearInterval(t);
  }, [cur?.countdownTo]);

  if (!n) return null;
  const go = (i: number) => setIdx((i + n) % n);
  const autoplaying = n > 1 && !paused && !reduced;

  return (
    <section
      className="dark hero"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-stage">
        <div
          className="hero-track"
          style={{ width: `${n * 100}%`, transform: `translateX(${(-idx * 100) / n}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className={['hero-slide', s.imageKind ?? 'plain', i === idx ? 'on' : ''].join(' ')}
              aria-hidden={i !== idx}
              style={{ flex: `0 0 ${100 / n}%`, backgroundColor: s.bg }}
            >
              {s.image && <div className="hero-bg" style={{ backgroundImage: `url("${s.image}")` }} />}
              {s.image && s.imageKind === 'poster' && (
                <img className="hero-poster" src={s.image} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
              )}
            </div>
          ))}
        </div>
        {cur.credit && <span className="hero-credit">{cur.credit}</span>}
        <div className="hero-copy">
          <div className="wrap">
            <div key={idx} className={'hero-text' + (cur.imageKind === 'poster' ? ' beside-poster' : '')} aria-live={paused ? 'polite' : 'off'}>
              <p className="t-kicker rise">{cur.kicker}</p>
              <h1 className={'t-display rise' + (cur.title.length > 28 ? ' long' : '')}>{cur.title}</h1>
              {cur.line && <p className="t-lead rise" style={{ marginTop: 24, maxWidth: 560 }}>{cur.line}</p>}
              {left && <p className="hero-countdown rise">Opens in {left}</p>}
              <div className="hero-actions rise">
                <a className="btn btn-a" {...linkProps(cur.cta.href)}>{cur.cta.label}</a>
                {cur.cta2 && <a className="btn btn-o" {...linkProps(cur.cta2.href)}>{cur.cta2.label}</a>}
              </div>
            </div>
            {n > 1 && (
              <div className="hero-arrows">
                <button type="button" aria-label="Previous" className="btn btn-o btn-i" onClick={() => go(idx - 1)}><Icon name="left" /></button>
                <button type="button" aria-label="Next" className="btn btn-o btn-i" onClick={() => go(idx + 1)}><Icon name="right" /></button>
              </div>
            )}
          </div>
        </div>
      </div>
      {n > 1 && (
        <div className="wrap hero-tabs">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              className="hero-tab"
              aria-current={i === idx}
              aria-label={`Highlight ${i + 1}: ${s.title}`}
              onClick={() => go(i)}
            >
              <span className="hero-bar" aria-hidden="true">
                {i === idx && (
                  <span
                    key={`${idx}-${autoplaying}`}
                    className={autoplaying ? 'fill run' : 'fill'}
                    style={{ animationDuration: `${seconds}s` }}
                  />
                )}
              </span>
              <span style={{ fontSize: 14 }}>{s.kicker}</span>
              <span className="t-title">{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
