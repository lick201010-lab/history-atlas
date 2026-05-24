import { useMemo } from 'react';
import eras from '../data/eras.json';
import { formatYear } from '../utils/formatYear.js';
import { findEra, findNearbyEvents } from '../utils/narrative.js';

export default function EraNarrative({ year, dynasties, onSelectEvent }) {
  const era = useMemo(() => findEra(eras, year), [year]);
  const events = useMemo(() => findNearbyEvents(dynasties, year, { window: 30, limit: 5 }), [dynasties, year]);
  const handlePickEvent = (event) => {
    onSelectEvent?.(event);
  };

  return (
    <aside className="era-narrative" aria-label="时代叙事">
      <header className="era-header" style={{ '--era-tone': era.toneColor || 'var(--gold)' }}>
        <div className="era-kicker">时代</div>
        <h4 className="era-title">{era.title}</h4>
        {era.titleEn ? <div className="era-en">{era.titleEn}</div> : null}
        <div className="era-range">
          {formatYear(era.startYear)} – {formatYear(era.endYear)}
        </div>
      </header>

      <p className="era-summary">{era.summary}</p>

      {era.keywords?.length ? (
        <div className="era-keywords">
          {era.keywords.map((kw) => (
            <span key={kw}>{kw}</span>
          ))}
        </div>
      ) : null}

      <section className="era-events">
        <div className="era-events-title">
          <span>事件浮现</span>
          <em>±30 年</em>
        </div>
        {events.length === 0 ? (
          <div className="era-events-empty">此时段暂无关键事件记录</div>
        ) : (
          <ul className="era-events-list">
            {events.map((event) => (
              <li key={event.key}>
                <button
                  type="button"
                  className="era-event era-event-button"
                  onPointerDown={() => handlePickEvent(event)}
                  onClick={() => handlePickEvent(event)}
                  title={`定位到 ${event.dynastyName}`}
                >
                  <span className="event-year" style={{ color: event.color }}>{formatYear(event.year)}</span>
                  <span className="event-body">
                    <span className="event-title">{event.title}</span>
                    <span className="event-dynasty">{event.dynastyName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
