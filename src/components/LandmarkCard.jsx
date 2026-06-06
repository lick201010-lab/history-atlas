import { memo } from 'react';
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

function stopCardEvent(event) {
  event.stopPropagation();
}

function LandmarkCard({
  landmark,
  dynastyById,
  immersive = false,
  onClose,
  onFlyTo,
  onToggleImmersive,
}) {
  if (!landmark) return null;

  const dynastyNames = buildDynastyNames(landmark, dynastyById);
  const activeRange = `${formatYear(landmark.startYear)} - ${formatYear(landmark.endYear)}`;

  return (
    <aside
      className={`landmark-card${immersive ? ' is-immersive' : ''}`}
      style={{ '--landmark-accent': landmark.color }}
      aria-label="建筑档案"
      onPointerDown={stopCardEvent}
      onPointerUp={stopCardEvent}
      onClick={stopCardEvent}
    >
      <div className="landmark-card-actions">
        <button
          type="button"
          className="card-action-btn landmark-locate"
          onClick={(event) => {
            event.stopPropagation();
            onFlyTo?.(landmark);
          }}
        >
          定位
        </button>
        <button
          type="button"
          className="card-action-btn landmark-inspect"
          aria-pressed={immersive}
          onClick={(event) => {
            event.stopPropagation();
            onToggleImmersive?.();
          }}
        >
          {immersive ? '退出' : '沉浸'}
        </button>
        <button
          type="button"
          className="card-action-btn territory-close"
          aria-label="关闭建筑卡"
          title="关闭"
          onClick={(event) => {
            event.stopPropagation();
            onClose?.();
          }}
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

      <div className="landmark-related">
        <span>关联文明</span>
        {dynastyNames.length ? (
          <div>
            {dynastyNames.map((name) => (
              <em key={name}>{name}</em>
            ))}
          </div>
        ) : (
          <div className="landmark-related-empty">暂无直接关联文明</div>
        )}
      </div>

      {landmark.sourceNote ? (
        <p className="landmark-source">{landmark.sourceNote}</p>
      ) : null}
    </aside>
  );
}

export default memo(LandmarkCard);
