// 精细化拜占庭帝国（byzantine）三阶段边界为 coastline-clipped 粗历史范围。
//
// 问题：原 byzantine 三个 feature 虽标注 coastline-aware-rough，但每个阶段
//   只用「一个凸包络」裁剪 Natural Earth 陆地 —— 凸包把希腊/安纳托利亚/黎凡特/
//   埃及用直线弦连起来，于是出现「粗线跨海压过去」（爱琴海、东地中海被直接抹平）。
//
// 解法：每个阶段改用「一组按陆块拆分的凸子包络」。每个子包络只圈住一块连贯陆地
//   （如安纳托利亚、巴尔干-希腊、克里特、塞浦路斯、黎凡特海岸…），切割线都落在海上，
//   于是裁剪结果是一组各自贴合海岸的多边形（MultiPolygon），不再跨海连成一片。
//
// 只重写 boundaries-simplified.json 里的 3 个 byzantine feature，其余 86 个不动。
// 输出 accuracy = "coastline-aware-rough"（保持渲染分层不变）。
//
// 运行：node scripts/refineByzantineBoundary.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const NE_URL = 'https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_land.json';
const CACHE_DIR = new URL('./.cache/', import.meta.url);
const CACHE_FILE = new URL('./.cache/ne_50m_land.json', import.meta.url);
const OUT = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const TARGET_ID = 'byzantine';

// =============================================================================
// 按陆块拆分的凸子包络（CCW 与否无所谓，下面会取凸包 + 规范化）
// 每块只圈一块连贯陆地，切割线尽量落海上。重叠区（如多文明阶段全是拜占庭）无害，
// 会在收集时按质心+面积去重。
// =============================================================================

// — 公共陆块（多阶段复用）—
const E_ANATOLIA = [ // 安纳托利亚（小亚细亚）
  [26, 40.5], [27, 36], [31, 36], [36, 36.2], [42, 37],
  [44, 38.5], [43, 41.5], [40, 42], [34, 42.3], [29, 41.5], [26, 40.5],
];
const E_BALKANS_GREECE = [ // 巴尔干 + 希腊半岛 + 西爱琴诸岛（西缘沿亚得里亚海，避开意大利）
  [13.5, 46], [17, 46.5], [22, 45], [27, 42], [27, 40],
  [24, 37.5], [23, 36], [20, 37], [18.5, 40], [15.5, 42], [13.5, 44],
];
const E_LEVANT = [ // 黎凡特沿岸（叙利亚/黎巴嫩/巴勒斯坦）
  [34, 30], [36, 30.5], [37, 33], [38, 36], [36.5, 37], [35, 36], [34.5, 33], [34, 30],
];
const E_EGYPT = [ // 埃及尼罗河流域 + 地中海岸（内陆为沙漠方块，北缘贴海岸）
  [27, 31.5], [31, 31.6], [34, 31], [34, 24], [32, 22], [27, 22], [27, 31.5],
];
const E_CYRENAICA = [ // 昔兰尼加（东利比亚沿岸）
  [19, 30], [25, 30], [25, 33], [22, 33.5], [19, 32.5], [19, 30],
];
const E_CYPRUS = [ // 塞浦路斯
  [32, 34.4], [34.7, 34.4], [34.7, 35.8], [32, 35.8], [32, 34.4],
];
const E_CRETE = [ // 克里特（含卡尔帕索斯一带）
  [23.3, 34.6], [26.4, 34.6], [26.4, 35.8], [23.3, 35.8], [23.3, 34.6],
];
const E_ITALY = [ // 意大利半岛 + 波河平原（凸包会跨亚得里亚，但峰期对岸也是拜占庭）
  [7, 46], [13, 46], [16, 41], [18.6, 40], [16, 38], [12, 38], [8, 44], [7, 46],
];
const E_SICILY = [ // 西西里（含马耳他、卡拉布里亚尖）
  [12, 36.4], [15.7, 36.4], [15.7, 38.5], [12, 38.5], [12, 36.4],
];
const E_SARD_CORS = [ // 撒丁 + 科西嘉
  [8, 38.8], [10, 38.8], [10, 43.2], [8, 43.2], [8, 38.8],
];
const E_NW_AFRICA = [ // 迦太基（突尼斯 + 阿尔及利亚沿岸）
  [1, 35], [11, 32.5], [11, 37.3], [2, 37.2], [1, 35],
];
const E_S_SPAIN = [ // 南西班牙（Spania，东南沿岸）
  [-6, 36], [0, 36.5], [0, 39], [-5, 39], [-6, 37],
];
const E_BALEARICS = [ // 巴利阿里群岛
  [1, 38.5], [4.5, 38.5], [4.5, 40.2], [1, 40.2], [1, 38.5],
];
const E_S_ITALY = [ // 南意大利（卡拉布里亚 + 阿普利亚），中后期残存
  [14.5, 37.8], [18.7, 39.5], [18, 41.5], [15.5, 40], [14.5, 37.8],
];

const PHASE_ENVELOPES = {
  // 立国（330–527）：巴尔干、安纳托利亚、黎凡特、埃及、昔兰尼加、塞浦路斯、克里特
  rise: [E_BALKANS_GREECE, E_ANATOLIA, E_LEVANT, E_EGYPT, E_CYRENAICA, E_CYPRUS, E_CRETE],
  // 查士丁尼复兴（528–640）：上述 + 意大利、西西里、撒丁科西嘉、北非、南西班牙、巴利阿里
  peak: [
    E_BALKANS_GREECE, E_ANATOLIA, E_LEVANT, E_EGYPT, E_CYRENAICA, E_CYPRUS, E_CRETE,
    E_ITALY, E_SICILY, E_SARD_CORS, E_NW_AFRICA, E_S_SPAIN, E_BALEARICS,
  ],
  // 中后期收缩（641–1453）：巴尔干、安纳托利亚、塞浦路斯、克里特、南意大利、西西里（早期）
  decline: [E_BALKANS_GREECE, E_ANATOLIA, E_CYPRUS, E_CRETE, E_S_ITALY, E_SICILY],
};

const PHASE_META = {
  rise: {
    phase: 'rise',
    startYear: 330, endYear: 527,
    phaseLabel: '东罗马 · 立国',
    summary: '君士坦丁建都后的东罗马，据有巴尔干、安纳托利亚、黎凡特与埃及。',
  },
  peak: {
    phase: 'peak',
    startYear: 528, endYear: 640,
    phaseLabel: '查士丁尼复兴',
    summary: '查士丁尼一度收复意大利、北非与南西班牙，环地中海重现罗马旧疆。',
  },
  decline: {
    phase: 'decline',
    startYear: 641, endYear: 1453,
    phaseLabel: '中后期收缩',
    summary: '阿拉伯与突厥兴起后帝国大幅收缩，长期以安纳托利亚与巴尔干为核心，终亡于1453。',
  },
};

const COMMON = { dynasty: '拜占庭帝国', color: '#9b59b6', capital: '君士坦丁堡' };
const ACCURACY_LABEL = '海岸贴合粗多边形';
const ACCURACY_NOTE = '各陆块沿海方向由 Natural Earth 50m 海岸线裁剪，内陆边界为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';
const SOURCE_NOTE = '用 Natural Earth 50m land 数据与按陆块拆分的历史势力凸包络求交得到 coastline-clipped 粗历史范围；包络参考维基百科拜占庭历代疆域图。';

// =============================================================================
// 几何工具（沿用 generateCoastAwareBoundaries.mjs 的实现）
// =============================================================================

function isInsideEdge(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
}
function lineIntersect(s, e, a, b) {
  const x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1];
  const x3 = s[0], y3 = s[1], x4 = e[0], y4 = e[1];
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-12) return [e[0], e[1]];
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}
function clipSubjectAgainstConvex(subject, clip) {
  let output = subject.slice();
  if (output.length > 1
      && output[0][0] === output[output.length - 1][0]
      && output[0][1] === output[output.length - 1][1]) {
    output = output.slice(0, -1);
  }
  for (let i = 0; i < clip.length - 1; i++) {
    if (output.length === 0) return [];
    const a = clip[i];
    const b = clip[i + 1];
    const input = output;
    output = [];
    let s = input[input.length - 1];
    for (const e of input) {
      const eIn = isInsideEdge(e, a, b);
      const sIn = isInsideEdge(s, a, b);
      if (eIn) {
        if (!sIn) output.push(lineIntersect(s, e, a, b));
        output.push(e);
      } else if (sIn) {
        output.push(lineIntersect(s, e, a, b));
      }
      s = e;
    }
  }
  return output;
}
function perpDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx, cy = a[1] + t * dy;
  const ex = p[0] - cx, ey = p[1] - cy;
  return Math.sqrt(ex * ex + ey * ey);
}
function douglasPeucker(points, eps) {
  if (points.length < 3) return points.slice();
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist < eps) return [first, last];
  const left = douglasPeucker(points.slice(0, maxIdx + 1), eps);
  const right = douglasPeucker(points.slice(maxIdx), eps);
  return [...left.slice(0, -1), ...right];
}
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area / 2);
}
function ringCentroid(ring) {
  let cx = 0, cy = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) { cx += ring[i][0]; cy += ring[i][1]; }
  return [cx / n, cy / n];
}
function ensureCCW(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += (ring[i + 1][0] - ring[i][0]) * (ring[i + 1][1] + ring[i][1]);
  }
  return s > 0 ? ring.slice().reverse() : ring;
}
function normalizeEnvelopeCCW(env) {
  let ring = env.slice();
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring = [...ring, [...ring[0]]];
  }
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  if (s < 0) ring = ring.slice().reverse();
  return ring;
}
function convexHull(points) {
  const pts = points.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 2) return pts.length ? [pts[0], pts[0]] : [];
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  const hull = [...lower, ...upper];
  hull.push([...hull[0]]);
  return hull;
}
function densifyRing(ring, maxStep = 1.5) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy);
    if (dist > maxStep) {
      const n = Math.ceil(dist / maxStep);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        out.push([a[0] + dx * t, a[1] + dy * t]);
      }
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

async function loadNaturalEarth() {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  }
  console.log('Downloading Natural Earth 50m land...');
  await mkdir(CACHE_DIR, { recursive: true });
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`NE download failed: ${res.status}`);
  const text = await res.text();
  await writeFile(CACHE_FILE, text);
  return JSON.parse(text);
}

// =============================================================================
// 主流程
// =============================================================================

const DOUGLAS_PEUCKER_EPS = 0.10; // 度（~11km），保留较细海岸/岛屿轮廓
const MIN_RING_AREA_SQDEG = 0.40; // 度²，保留克里特/塞浦路斯等关键大岛，过滤爱琴海小碎片乱线

// 内陆长边「去直线化」参数
const INLAND_EDGE_THRESHOLD = 0.55; // 度：相邻顶点超过此距离 → 视为内陆包络直边
const INLAND_RESAMPLE_STEP = 0.32;  // 度：内陆边重采样步长
const INLAND_MAX_AMP = 0.24;        // 度（~24km）：法向起伏最大幅度

// 确定性伪随机 [0,1)（同坐标恒得同值，输出可复现）
function hash01(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/**
 * 把环里的「内陆长直边」去直线化：沿边加密，并施加沿法线的平滑起伏。
 * 起伏用 sin(t·π) 作包络 → 两端（多半是海岸接缝处）扰动为 0，不破坏海岸连接；
 * 中段用两个不同频率正弦叠加，读作粗糙自然边界而非笔直斜线。
 * 海岸段（DP 后顶点密集、边长 < 阈值）原样保留。
 */
function roughenRing(ring) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len <= INLAND_EDGE_THRESHOLD) continue;
    const n = Math.ceil(len / INLAND_RESAMPLE_STEP);
    const nx = -dy / len; // 单位法线
    const ny = dx / len;
    const amp = Math.min(INLAND_MAX_AMP, len * 0.11);
    const ph = hash01(Math.round(a[0] * 7), Math.round(a[1] * 7)) * Math.PI * 2;
    for (let k = 1; k < n; k += 1) {
      const t = k / n;
      const env = Math.sin(t * Math.PI); // 端点为 0
      const wob = 0.62 * Math.sin(t * Math.PI * 2 + ph)
                + 0.38 * Math.sin(t * Math.PI * 5 + ph * 1.7);
      const off = amp * env * wob;
      out.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

function buildPhaseRings(landRings, rawEnvelopes) {
  const collected = [];
  const seen = new Set();
  for (const rawEnv of rawEnvelopes) {
    const hullRing = convexHull(rawEnv);
    const envelope = densifyRing(normalizeEnvelopeCCW(hullRing), 1.5);
    for (const ring of landRings) {
      const clipped = clipSubjectAgainstConvex(ring, envelope);
      if (clipped.length < 3) continue;
      let r = clipped;
      if (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) {
        r = [...r, [...r[0]]];
      }
      let simplified = douglasPeucker(r, DOUGLAS_PEUCKER_EPS);
      if (simplified.length < 5) continue;
      if (simplified[0][0] !== simplified[simplified.length - 1][0]
          || simplified[0][1] !== simplified[simplified.length - 1][1]) {
        simplified.push([...simplified[0]]);
      }
      const area = ringArea(simplified);
      if (area < MIN_RING_AREA_SQDEG) continue;
      // 去重：同一陆块被相邻子包络重复裁出 → 按质心+面积粗签名跳过
      const [cx, cy] = ringCentroid(simplified);
      const sig = `${Math.round(cx * 5) / 5},${Math.round(cy * 5) / 5},${Math.round(area * 2) / 2}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      // 内陆长直边去直线化（海岸密集段不受影响）
      const roughened = roughenRing(simplified);
      collected.push(ensureCCW(roughened));
    }
  }
  return collected;
}

async function main() {
  const land = await loadNaturalEarth();
  const landRings = [];
  for (const feat of land.features) {
    if (feat.geometry.type === 'Polygon') {
      landRings.push(feat.geometry.coordinates[0]);
    } else if (feat.geometry.type === 'MultiPolygon') {
      for (const poly of feat.geometry.coordinates) landRings.push(poly[0]);
    }
  }
  console.log(`Loaded ${landRings.length} land rings from Natural Earth 50m`);

  const byzFeatures = [];
  for (const [phase, rawEnvelopes] of Object.entries(PHASE_ENVELOPES)) {
    const meta = PHASE_META[phase];
    let rings = buildPhaseRings(landRings, rawEnvelopes);
    if (rings.length === 0) {
      console.warn(`${phase}: no rings survived`);
      continue;
    }
    // 坐标精度 3 位小数
    for (const ring of rings) {
      for (const pt of ring) {
        pt[0] = Math.round(pt[0] * 1000) / 1000;
        pt[1] = Math.round(pt[1] * 1000) / 1000;
      }
    }
    rings.sort((a, b) => ringArea(b) - ringArea(a)); // 大陆块在前
    const geometry = rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
    const verts = rings.reduce((s, r) => s + r.length, 0);
    console.log(`${phase}: ${rings.length} polygon(s), ${verts} vertices`);

    byzFeatures.push({
      type: 'Feature',
      id: TARGET_ID,
      properties: {
        id: TARGET_ID,
        dynasty: COMMON.dynasty,
        phase: meta.phase,
        phaseLabel: meta.phaseLabel,
        startYear: meta.startYear,
        endYear: meta.endYear,
        color: COMMON.color,
        capital: COMMON.capital,
        summary: meta.summary,
        accuracy: 'coastline-aware-rough',
        accuracyLabel: ACCURACY_LABEL,
        accuracyNote: ACCURACY_NOTE,
        sourceNote: SOURCE_NOTE,
      },
      geometry,
    });
  }

  const existing = JSON.parse(await readFile(OUT, 'utf8'));
  const others = existing.features.filter((f) => f.properties.id !== TARGET_ID);
  const merged = {
    type: 'FeatureCollection',
    features: [...others, ...byzFeatures],
  };
  await writeFile(OUT, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\nWrote ${merged.features.length} features (${others.length} other + ${byzFeatures.length} byzantine) → ${new URL(OUT).pathname}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
