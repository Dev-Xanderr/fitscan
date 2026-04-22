import { useEffect, useState } from 'react';

/**
 * Telemetry primitives shared by all booth screens.
 *
 * Pulled out of CameraView so the Landing, Scan and Routine pages can speak
 * the same visual language — numbered section rails, corner-bracketed frames,
 * and a wall-clock readout — without duplicating the same handful of lines.
 */

/** Numbered section header used at the top of a vertical rail block. */
export function SectionLabel({ n, title, accent = true, className = '' }) {
  return (
    <div
      className={`flex items-center gap-3 font-ui text-[10px] uppercase tracking-[0.4em] text-text/40 ${className}`}
    >
      <span className={accent ? 'text-accent' : 'text-text/60'}>{n}</span>
      <span className="text-text/20">/</span>
      <span>{title}</span>
      <span className="flex-1 h-px bg-text/10" />
    </div>
  );
}

/** Outer corner bracket that frames a boxy region (camera, modal, panel). */
export function Bracket({ pos, size = 'md', color = 'accent' }) {
  const corners = {
    tl: 'top-0 left-0 border-l border-t',
    tr: 'top-0 right-0 border-r border-t',
    bl: 'bottom-0 left-0 border-l border-b',
    br: 'bottom-0 right-0 border-r border-b',
  };
  const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-8 h-8' };
  const colors = {
    accent: 'border-accent',
    muted: 'border-text/30',
    soft: 'border-text/10',
  };
  return (
    <span
      className={`pointer-events-none absolute z-30 ${sizes[size]} ${colors[color]} ${corners[pos]}`}
      aria-hidden="true"
    />
  );
}

/** All four corner brackets in one tag, for convenience. */
export function BracketFrame({ size = 'md', color = 'accent' }) {
  return (
    <>
      <Bracket pos="tl" size={size} color={color} />
      <Bracket pos="tr" size={size} color={color} />
      <Bracket pos="bl" size={size} color={color} />
      <Bracket pos="br" size={size} color={color} />
    </>
  );
}

/** Tabular formatters so telemetry chips don't jitter as digits change width. */
export const padFrame = (n, len = 5) => String(n).padStart(len, '0');
export const formatClock = (d) => d.toTimeString().slice(0, 8);

/**
 * Wall-clock ticker. Updates once a second. Use it sparingly — every consumer
 * re-renders on each tick, so prefer this in low-traffic top bars.
 */
export function useClock() {
  const [clock, setClock] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

/**
 * Top-bar telemetry — common header shared by Landing/Scan/Routine. Pass the
 * stage label (e.g. "LANDING") and an optional `right` slot for context-
 * specific readouts (frame counter, reset countdown, etc.). The wordmark + LIVE
 * indicator are baked in.
 */
export function TopBar({ stage, right = null, accentLive = true }) {
  const clock = useClock();
  // BASE_URL is "/fitscan/" in prod (GitHub Pages), "/" in dev — strip the
  // trailing slash so the path concatenation reads cleanly in both modes.
  const brandSrc = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/brand/horizontal-white.png`;
  return (
    <header className="border-b border-text/10 px-6 sm:px-10 py-4 flex items-center justify-between font-ui text-[11px] tracking-[0.3em] uppercase">
      <div className="flex items-center gap-4">
        <img
          src={brandSrc}
          alt="SQUATWOLF"
          className="h-5 w-auto opacity-80"
          draggable={false}
        />
        <span className="text-text/20">/</span>
        <span className="text-accent">{stage}</span>
      </div>
      <div className="flex items-center gap-6 text-text/40">
        {right}
        <span className="hidden md:inline tabular-nums text-text/60">{clock}</span>
        {accentLive && (
          <span className="flex items-center gap-2 text-text">
            <span className="w-2 h-2 bg-accent inline-block pulse-glow" />
            LIVE
          </span>
        )}
      </div>
    </header>
  );
}

/** Bottom telemetry bar. Pass current stage number (1-3) for the indicator. */
export function BottomBar({ stage, total = 3, tagline = '▸ READ. LOCK. BUILD.' }) {
  return (
    <footer className="border-t border-text/10 px-6 sm:px-10 py-3 flex items-center justify-between font-ui text-[10px] tracking-[0.4em] uppercase text-text/30">
      <span>
        STAGE / <span className="tabular-nums text-text/60">{padFrame(stage, 2)}</span>{' '}
        OF {padFrame(total, 2)}
      </span>
      <span className="hidden sm:inline">SQUATWOLF · BORN IN DUBAI</span>
      <span className="text-accent">{tagline}</span>
    </footer>
  );
}
