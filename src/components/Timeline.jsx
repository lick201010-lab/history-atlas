import { useEffect, useRef, useState } from 'react';
import { TIMELINE_MARKERS } from '../utils/narrative.js';
import { formatYear } from '../utils/formatYear.js';

const MIN_YEAR = -2000;
const MAX_YEAR = 2025;
const SPAN = MAX_YEAR - MIN_YEAR;

export default function Timeline({ year, onYearChange, formatYear: format }) {
  // Local display value for instant slider/label feedback; the commit to the
  // app (which triggers the App-render + map setFilter cascade) is coalesced to
  // at most one per animation frame so dragging stays smooth.
  const [displayYear, setDisplayYear] = useState(year);
  const rafRef = useRef(0);
  const pendingRef = useRef(year);

  // Sync from external year changes (markers, search, era events). Skip the echo
  // of our own committed value so an in-flight drag is never yanked backwards.
  useEffect(() => {
    if (year === pendingRef.current) return;
    pendingRef.current = year;
    setDisplayYear(year);
  }, [year]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const commitThrottled = (value) => {
    pendingRef.current = value;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      onYearChange(pendingRef.current);
    });
  };

  const handleYearInput = (event) => {
    const value = Number.parseInt(event.target.value, 10);
    setDisplayYear(value);
    commitThrottled(value);
  };

  // Marker / discrete jumps commit immediately (no drag to coalesce).
  const jumpTo = (value) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    pendingRef.current = value;
    setDisplayYear(value);
    onYearChange(value);
  };

  return (
    <div className="timeline">
      <div className="timeline-inner">
        <div className="timeline-header">
          <span className="timeline-label">时间轴 TIMELINE</span>
          <span className="timeline-year" id="year-display">{format(displayYear)}</span>
        </div>
        <div className="timeline-track-wrap">
          <input
            id="time-slider"
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={displayYear}
            step="1"
            onInput={handleYearInput}
            onChange={handleYearInput}
          />
          <div className="timeline-markers" aria-hidden="true">
            {TIMELINE_MARKERS.map((marker) => {
              const pct = ((marker.year - MIN_YEAR) / SPAN) * 100;
              const active = Math.abs(marker.year - displayYear) <= 12;
              return (
                <button
                  key={marker.year}
                  type="button"
                  className={`timeline-marker${active ? ' active' : ''}`}
                  style={{ left: `${pct}%` }}
                  title={`${formatYear(marker.year)} · ${marker.label}`}
                  onClick={() => jumpTo(marker.year)}
                  tabIndex={-1}
                >
                  <span className="marker-dot" />
                  <span className="marker-tip">
                    <em>{formatYear(marker.year)}</em>
                    {marker.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="timeline-ticks">
          <span>公元前 2000</span>
          <span>公元前 1000</span>
          <span>公元 0</span>
          <span>公元 1000</span>
          <span>公元 2025</span>
        </div>
      </div>
    </div>
  );
}
