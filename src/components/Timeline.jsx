import { TIMELINE_MARKERS } from '../utils/narrative.js';
import { formatYear } from '../utils/formatYear.js';

const MIN_YEAR = -2000;
const MAX_YEAR = 2025;
const SPAN = MAX_YEAR - MIN_YEAR;

export default function Timeline({ year, onYearChange, formatYear: format }) {
  const handleYearInput = (event) => {
    onYearChange(Number.parseInt(event.target.value, 10));
  };

  return (
    <div className="timeline">
      <div className="timeline-inner">
        <div className="timeline-header">
          <span className="timeline-label">时间轴 TIMELINE</span>
          <span className="timeline-year" id="year-display">{format(year)}</span>
        </div>
        <div className="timeline-track-wrap">
          <input
            id="time-slider"
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            step="1"
            onInput={handleYearInput}
            onChange={handleYearInput}
          />
          <div className="timeline-markers" aria-hidden="true">
            {TIMELINE_MARKERS.map((marker) => {
              const pct = ((marker.year - MIN_YEAR) / SPAN) * 100;
              const active = Math.abs(marker.year - year) <= 12;
              return (
                <button
                  key={marker.year}
                  type="button"
                  className={`timeline-marker${active ? ' active' : ''}`}
                  style={{ left: `${pct}%` }}
                  title={`${formatYear(marker.year)} · ${marker.label}`}
                  onClick={() => onYearChange(marker.year)}
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
