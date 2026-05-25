import { formatYear } from '../utils/formatYear.js';

function buildDynastyNames(landmark, dynastyById) {
  return (landmark.relatedDynastyIds || [])
    .map((id) => dynastyById.get(id)?.name)
    .filter(Boolean);
}

function importanceText(value = 3) {
  const score = Math.max(1, Math.min(5, Number(value) || 3));
  return `${'◆'.repeat(score)}${'◇'.repeat(5 - score)}`;
}

export default function LandmarkCard({
  landmark,
  dynastyById,
  onClose,
  onFlyTo,
}) {
  if (!landmark) return null;

  const dynastyNames = buildDynastyNames(landmark, dynastyById);
  const activeRange = `${formatYear(landmark.startYear)} - ${formatYear(landmark.endYear)}`;

  return (
    <aside
      className="landmark-card"
      style={{ '--landmark-accent': landmark.color }}
      aria-label="建筑档案"
    >
      <div className="landmark-card-actions">
        <button
          type="button"
          className="card-action-btn landmark-locate"
          onClick={() => onFlyTo?.(landmark)}
        >
          定位
        </button>
        <button
          type="button"
          className="card-action-btn territory-close"
          aria-label="关闭建筑卡"
          title="关闭"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="landmark-kicker">建筑档案</div>
      <h3 className="landmark-name">{landmark.name}</h3>
      <div className="landmark-meta">
        <span>{landmark.typeLabel || landmark.type}</span>
        <span>{activeRange}</span>
      </div>

      <p className="landmark-summary">
        {landmark.summary || `${landmark.name} 是当前历史沙盘中的代表性建筑，用于标记文明活动与城市记忆。`}
      </p>

      <div className="landmark-grid">
        <div>
          <span>区域</span>
          <strong>{landmark.region || '跨区域'}</strong>
        </div>
        <div>
          <span>重要性</span>
          <strong>{importanceText(landmark.importance)}</strong>
        </div>
      </div>

      {dynastyNames.length ? (
        <div className="landmark-related">
          <span>关联文明</span>
          <div>
            {dynastyNames.map((name) => (
              <em key={name}>{name}</em>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
