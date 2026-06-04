// 精细化四文明边界：奥斯曼、蒙古帝国、萨珊波斯、阿契美尼德波斯
//
// 对每个目标 civ，按阶段（有则）设计凸包络，用 Natural Earth 50m 海岸线裁剪，
// 内陆边去直线化，过滤小碎岛，输出 coastline-aware-rough 粗历史边界。
//
// 运行：node scripts/refinePriorityBoundaries.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const NE_URL = 'https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_land.json';
const CACHE_DIR = new URL('./.cache/', import.meta.url);
const CACHE_FILE = new URL('./.cache/ne_50m_land.json', import.meta.url);
const OUT = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const TARGET_IDS = new Set(['ottoman', 'sasanian', 'achaemenid']);

// =============================================================================
// 几何工具（沿用 refineByzantineBoundary.mjs 实现）
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

// =============================================================================
// 内陆长边「去直线化」
// =============================================================================

const DOUGLAS_PEUCKER_EPS = 0.10;
const MIN_RING_AREA_SQDEG = 0.40;
const INLAND_EDGE_THRESHOLD = 0.55;
const INLAND_RESAMPLE_STEP = 0.32;
const INLAND_MAX_AMP = 0.24;

function hash01(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

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
    const nx = -dy / len;
    const ny = dx / len;
    const amp = Math.min(INLAND_MAX_AMP, len * 0.11);
    const ph = hash01(Math.round(a[0] * 7), Math.round(a[1] * 7)) * Math.PI * 2;
    for (let k = 1; k < n; k += 1) {
      const t = k / n;
      const env = Math.sin(t * Math.PI);
      const wob = 0.62 * Math.sin(t * Math.PI * 2 + ph)
                + 0.38 * Math.sin(t * Math.PI * 5 + ph * 1.7);
      const off = amp * env * wob;
      out.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

// =============================================================================
// NE land 加载 & 裁剪主函数
// =============================================================================

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

function buildPhaseRings(landRings, rawEnvelopes, opts = {}) {
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
      const [cx, cy] = ringCentroid(simplified);
      const sig = `${Math.round(cx * 5) / 5},${Math.round(cy * 5) / 5},${Math.round(area * 2) / 2}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      const roughened = roughenRing(simplified);
      collected.push(ensureCCW(roughened));
    }
  }
  // 可选：只保留最大的 N 个环（用于单 envelope 覆盖广阔区域时过滤离岛碎片）
  if (opts.maxRings && collected.length > opts.maxRings) {
    collected.sort((a, b) => ringArea(b) - ringArea(a));
    return collected.slice(0, opts.maxRings);
  }
  return collected;
}

// =============================================================================
// 各文明的 envelope 定义
// =============================================================================

// ---------- 奥斯曼 Ottoman (3 phases) ----------
// 采用按陆块拆分的子包络，每块只圈一块连贯陆地，切割线落在海上

const E_ANATOLIA = [
  [26, 40.5], [27, 36], [31, 36], [36, 36.2], [42, 37],
  [44, 38.5], [43, 41.5], [40, 42], [34, 42.3], [29, 41.5], [26, 40.5],
];
const E_BALKANS = [
  [13.5, 46], [17, 46.5], [22, 45], [27, 42], [27, 40],
  [24, 37.5], [23, 36], [20, 37], [18.5, 40], [15.5, 42], [13.5, 44],
];
const E_LEVANT = [
  [34, 30], [36, 30.5], [37, 33], [38, 36], [36.5, 37], [35, 36], [34.5, 33], [34, 30],
];
const E_EGYPT = [
  [27, 31.5], [31, 31.6], [34, 31], [34, 24], [32, 22], [27, 22], [27, 31.5],
];
// 北非沿岸（利比亚/突尼斯/阿尔及利亚）— 奥斯曼名义宗主权
const E_NORTH_AFRICA = [
  [9, 37], [11, 32], [25, 32], [27, 34], [20, 37.5], [9, 37],
];
// 美索不达米亚 / 伊拉克
const E_MESOPOTAMIA = [
  [38, 37.5], [40, 33], [44, 30], [48, 30], [48.5, 34], [46.5, 37], [38, 37.5],
];
// 汉志 / 阿拉伯西部红海沿岸
const E_HEJAZ = [
  [34, 30.5], [38.5, 30], [39, 23], [43, 16], [47.5, 13.5], [48, 22], [44, 26], [39.5, 28], [36, 29], [34, 30.5],
];
// 克里米亚 / 黑海北岸（peak only）
const E_CRIMEA = [
  [28.5, 47.2], [32.5, 44.8], [40, 45.5], [40, 48], [36.5, 48.2], [28.5, 47.2],
];
// 塞浦路斯
const E_CYPRUS = [
  [32, 34.4], [34.7, 34.4], [34.7, 35.8], [32, 35.8], [32, 34.4],
];
// 克里特
const E_CRETE = [
  [23.3, 34.6], [26.4, 34.6], [26.4, 35.8], [23.3, 35.8], [23.3, 34.6],
];
// 匈牙利 / 潘诺尼亚（peak 延伸）
const E_HUNGARY = [
  [16, 46], [19, 46.5], [23, 47.5], [23, 49], [19, 48.5], [16, 47.5], [16, 46],
];

const OTTOMAN_PHASE_ENVELOPES = {
  rise: [E_ANATOLIA, E_BALKANS],
  peak: [
    E_ANATOLIA, E_BALKANS, E_HUNGARY, E_LEVANT, E_EGYPT,
    E_NORTH_AFRICA, E_MESOPOTAMIA, E_HEJAZ, E_CRIMEA, E_CYPRUS, E_CRETE,
  ],
  decline: [E_ANATOLIA, E_LEVANT, E_MESOPOTAMIA, E_HEJAZ],
};

const OTTOMAN_PHASE_META = {
  rise: {
    phase: 'rise',
    startYear: 1299, endYear: 1453,
    phaseLabel: '立国 · 巴尔干扩张',
    summary: '奥斯曼自西北安纳托利亚崛起，跨海经略巴尔干，1453年攻陷君士坦丁堡。',
  },
  peak: {
    phase: 'peak',
    startYear: 1454, endYear: 1683,
    phaseLabel: '苏莱曼极盛',
    summary: '苏莱曼时代版图横跨巴尔干—匈牙利、安纳托利亚、黎凡特、埃及北非与两河、汉志，1683年抵维也纳城下。',
  },
  decline: {
    phase: 'decline',
    startYear: 1684, endYear: 1922,
    phaseLabel: '晚期收缩',
    summary: '维也纳受挫后帝国渐失匈牙利与大部分巴尔干，收缩至安纳托利亚、黎凡特与两河，终结于1922。',
  },
};

const OTTOMAN_COMMON = {
  dynasty: '奥斯曼帝国',
  color: '#c0392b',
  capital: '伊斯坦布尔',
};

// 蒙古帝国暂不在本脚本里重写。它是巨大内陆帝国，Claude 初稿的单凸包络
// 会变成斜切大条带；Codex 复核后决定保留既有基线，后续另开专项处理。

// ---------- 萨珊波斯 Sasanian (3 phases) ----------
// 单 envelope per phase；全在一个陆块上，NE clip 沿波斯湾/里海走海岸

const SASANIAN_ENVELOPES = {
  rise: [
    // 伊朗高原 + 美索不达米亚（核心）
    [38, 37.5], [41, 33.5], [46, 29], [52, 25.5], [60, 25.5],
    [66, 28], [70, 31], [70, 37.5], [62, 40.5], [52, 41.5],
    [45, 42.5], [40.5, 42.5], [38, 37.5],
  ],
  peak: [
    // 极盛（霍斯劳一世/二世）：伊朗高原 + 两河 + 黎凡特 + 埃及 + 高加索 + 中亚东拓
    [25.5, 34.5], // 埃及西边界
    [31, 31.5],   // 尼罗河三角洲
    [33.5, 30.5], // 加沙/黎凡特
    [37, 32.5],   // 叙利亚
    [41, 37.5],   // 北两河
    [48, 42.5],   // 高加索
    [54, 44],     // 里海西北
    [63, 42],     // 中亚
    [70, 38],     // 东伊朗/阿富汗
    [73, 34],     // 印度河流域方向
    [68, 28],     // 东南伊朗
    [62, 24],     // 波斯湾口
    [56, 24],     // 南伊朗
    [48, 26],     // 波斯湾
    [42, 28],     // 阿拉伯方向（不过波斯湾中线）
    [36, 28.5],   // 西奈方向
    [30, 28],     // 埃及南界
    [25.5, 34.5],
  ],
  decline: [
    // 晚期收缩：伊朗高原 + 两河
    [38, 37.5], [41, 33.5], [46, 29], [52, 25.5], [60, 25.5],
    [66, 28], [70, 31], [70, 37.5], [62, 40.5], [52, 41.5],
    [45, 42.5], [40.5, 42.5], [38, 37.5],
  ],
};

const SASANIAN_PHASE_META = {
  rise: {
    phase: 'rise',
    startYear: 224, endYear: 530,
    phaseLabel: '萨珊立国',
    summary: '阿尔达希尔与沙普尔立国，据有伊朗高原与两河，与罗马长期对峙。',
  },
  peak: {
    phase: 'peak',
    startYear: 531, endYear: 628,
    phaseLabel: '霍斯劳极盛',
    summary: '霍斯劳一世与二世时代拓至黎凡特、埃及与也门，与拜占庭争雄地中海东岸。',
  },
  decline: {
    phase: 'decline',
    startYear: 629, endYear: 651,
    phaseLabel: '阿拉伯征服',
    summary: '与拜占庭长期消耗后国力空虚，终为阿拉伯穆斯林大军所灭。',
  },
};

const SASANIAN_COMMON = {
  dynasty: '萨珊波斯',
  color: '#1abc9c',
  capital: '泰西封',
};

// ---------- 阿契美尼德波斯 Achaemenid (3 phases) ----------
// 单 envelope per phase；版图从安纳托利亚/埃及经伊朗到中亚/印度河

const ACHAEMENID_ENVELOPES = {
  rise: [
    // 居鲁士开国：伊朗高原 + 两河 + 安纳托利亚 + 黎凡特
    [26, 41],    // 安纳托利亚西岸
    [35, 37],    // 奇里乞亚
    [41, 37.5],  // 北两河
    [47, 42],    // 亚美尼亚高地
    [53, 42],    // 里海南岸
    [58, 38],    // 东伊朗
    [64, 33],    // 波斯湾东岸
    [62, 27],    // 东南伊朗
    [56, 25],    // 法尔斯
    [49, 26],    // 波斯湾
    [43, 28.5],  // 南两河
    [37, 32],    // 叙利亚
    [32, 31],    // 以色列/黎凡特
    [28, 32.5],  // 地中海东岸
    [26, 41],
  ],
  peak: [
    // 大流士极盛：安纳托利亚+埃及+两河+伊朗+中亚+印度河
    [26, 41.5],  // 安纳托利亚西
    [30, 37],    // 地中海东
    [31, 31.5],  // 尼罗河口
    [27, 22],    // 埃及南（努比亚）
    [32, 22],    // 红海西岸
    [36, 26],    // 西奈/红海北
    [42, 27.5],  // 阿拉伯北缘（不过波斯湾）
    [49, 26],    // 波斯湾
    [56, 24],    // 波斯湾口
    [63, 25],    // 莫克兰海岸
    [68, 27],    // 印度河下游
    [72, 30],    // 旁遮普
    [73, 34.5],  // 印度河上游
    [69, 38],    // 巴克特里亚
    [63, 42],    // 栗特/河中
    [54, 44],    // 里海东
    [49, 43],    // 高加索
    [42, 43],    // 亚美尼亚
    [37, 42],    // 安纳托利亚东
    [30, 43],    // 黑海南岸
    [26, 41.5],
  ],
  decline: [
    // 晚期收缩：仍拥伊朗高原 + 两河 + 安纳托利亚 + 黎凡特 + 埃及
    [25, 41],    // 安纳托利亚西
    [33, 36],    // 奇里乞亚
    [38, 37],    // 北两河
    [45, 41.5],  // 亚美尼亚
    [51, 42],    // 里海南
    [59, 38],    // 东伊朗
    [64, 32],    // 波斯湾东
    [60, 27],    // 东南伊朗
    [53, 25],    // 法尔斯
    [48, 26],    // 波斯湾
    [41, 28],    // 南两河
    [34, 30],    // 黎凡特
    [30, 31],    // 地中海东岸
    [26, 32],    // 埃及地中海沿岸
    [28, 25],    // 上埃及
    [32, 23],    // 红海
    [34, 27],    // 西奈
    [31, 31],    // 三角洲
    [25, 41],
  ],
};

const ACHAEMENID_PHASE_META = {
  rise: {
    phase: 'rise',
    startYear: -550, endYear: -522,
    phaseLabel: '居鲁士开国',
    summary: '居鲁士兼并米底、吕底亚与巴比伦，奠定横跨伊朗高原、两河与安纳托利亚的帝国。',
  },
  peak: {
    phase: 'peak',
    startYear: -521, endYear: -486,
    phaseLabel: '大流士极盛',
    summary: '大流士一世扩展至印度河、色雷斯与利比亚，建立行省制度与御道网络。',
  },
  decline: {
    phase: 'decline',
    startYear: -485, endYear: -330,
    phaseLabel: '希腊战争至灭亡',
    summary: '希波战争后帝国渐衰，宫廷内斗频繁，终为亚历山大大帝所灭。',
  },
};

const ACHAEMENID_COMMON = {
  dynasty: '阿契美尼德波斯',
  color: '#27ae60',
  capital: '波斯波利斯',
};

// =============================================================================
// 共用元数据
// =============================================================================

const ACCURACY_LABEL = '海岸贴合粗多边形';
const ACCURACY_NOTE = '各陆块沿海方向由 Natural Earth 50m 海岸线裁剪，内陆边界为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';
const SOURCE_NOTE_OTTOMAN = '用 Natural Earth 50m land 数据与按陆块拆分的历史势力凸包络求交得到 coastline-clipped 粗历史范围；包络参考维基百科奥斯曼历代疆域图。';
const SOURCE_NOTE_SASANIAN = '用 Natural Earth 50m land 数据与历史势力包络求交，沿波斯湾/里海海岸线自然收边；包络参考维基百科萨珊历代疆域图。';
const SOURCE_NOTE_ACHAEMENID = '用 Natural Earth 50m land 数据与历史势力包络求交，沿地中海/波斯湾/里海海岸线自然收边；包络参考维基百科阿契美尼德历代疆域图。';

// =============================================================================
// 主流程
// =============================================================================

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

  const newFeatures = [];

  // ----- 奥斯曼 Ottoman (3 phases, sub-envelope approach) -----
  console.log('\n--- Ottoman ---');
  for (const [phase, rawEnvelopes] of Object.entries(OTTOMAN_PHASE_ENVELOPES)) {
    const meta = OTTOMAN_PHASE_META[phase];
    let rings = buildPhaseRings(landRings, rawEnvelopes);
    if (rings.length === 0) {
      console.warn(`  ottoman ${phase}: no rings survived`);
      continue;
    }
    for (const ring of rings) {
      for (const pt of ring) {
        pt[0] = Math.round(pt[0] * 1000) / 1000;
        pt[1] = Math.round(pt[1] * 1000) / 1000;
      }
    }
    rings.sort((a, b) => ringArea(b) - ringArea(a));
    const geometry = rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
    const verts = rings.reduce((s, r) => s + r.length, 0);
    console.log(`  ${phase}: ${rings.length} polygon(s), ${verts} vertices`);

    newFeatures.push({
      type: 'Feature',
      id: 'ottoman',
      properties: {
        id: 'ottoman',
        dynasty: OTTOMAN_COMMON.dynasty,
        phase: meta.phase,
        phaseLabel: meta.phaseLabel,
        startYear: meta.startYear,
        endYear: meta.endYear,
        color: OTTOMAN_COMMON.color,
        capital: OTTOMAN_COMMON.capital,
        summary: meta.summary,
        accuracy: 'coastline-aware-rough',
        accuracyLabel: ACCURACY_LABEL,
        accuracyNote: ACCURACY_NOTE,
        sourceNote: SOURCE_NOTE_OTTOMAN,
      },
      geometry,
    });
  }

  // ----- 萨珊波斯 Sasanian (3 phases, single envelope per phase) -----
  console.log('\n--- Sasanian ---');
  for (const [phase, rawEnv] of Object.entries(SASANIAN_ENVELOPES)) {
    const meta = SASANIAN_PHASE_META[phase];
    let rings = buildPhaseRings(landRings, [rawEnv]);
    if (rings.length === 0) {
      console.warn(`  sasanian ${phase}: no rings survived`);
      continue;
    }
    for (const ring of rings) {
      for (const pt of ring) {
        pt[0] = Math.round(pt[0] * 1000) / 1000;
        pt[1] = Math.round(pt[1] * 1000) / 1000;
      }
    }
    rings.sort((a, b) => ringArea(b) - ringArea(a));
    const geometry = rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
    const verts = rings.reduce((s, r) => s + r.length, 0);
    console.log(`  ${phase}: ${rings.length} polygon(s), ${verts} vertices`);

    newFeatures.push({
      type: 'Feature',
      id: 'sasanian',
      properties: {
        id: 'sasanian',
        dynasty: SASANIAN_COMMON.dynasty,
        phase: meta.phase,
        phaseLabel: meta.phaseLabel,
        startYear: meta.startYear,
        endYear: meta.endYear,
        color: SASANIAN_COMMON.color,
        capital: SASANIAN_COMMON.capital,
        summary: meta.summary,
        accuracy: 'coastline-aware-rough',
        accuracyLabel: ACCURACY_LABEL,
        accuracyNote: ACCURACY_NOTE,
        sourceNote: SOURCE_NOTE_SASANIAN,
      },
      geometry,
    });
  }

  // ----- 阿契美尼德波斯 Achaemenid (3 phases, single envelope per phase) -----
  console.log('\n--- Achaemenid ---');
  for (const [phase, rawEnv] of Object.entries(ACHAEMENID_ENVELOPES)) {
    const meta = ACHAEMENID_PHASE_META[phase];
    let rings = buildPhaseRings(landRings, [rawEnv]);
    if (rings.length === 0) {
      console.warn(`  achaemenid ${phase}: no rings survived`);
      continue;
    }
    for (const ring of rings) {
      for (const pt of ring) {
        pt[0] = Math.round(pt[0] * 1000) / 1000;
        pt[1] = Math.round(pt[1] * 1000) / 1000;
      }
    }
    rings.sort((a, b) => ringArea(b) - ringArea(a));
    const geometry = rings.length === 1
      ? { type: 'Polygon', coordinates: [rings[0]] }
      : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
    const verts = rings.reduce((s, r) => s + r.length, 0);
    console.log(`  ${phase}: ${rings.length} polygon(s), ${verts} vertices`);

    newFeatures.push({
      type: 'Feature',
      id: 'achaemenid',
      properties: {
        id: 'achaemenid',
        dynasty: ACHAEMENID_COMMON.dynasty,
        phase: meta.phase,
        phaseLabel: meta.phaseLabel,
        startYear: meta.startYear,
        endYear: meta.endYear,
        color: ACHAEMENID_COMMON.color,
        capital: ACHAEMENID_COMMON.capital,
        summary: meta.summary,
        accuracy: 'coastline-aware-rough',
        accuracyLabel: ACCURACY_LABEL,
        accuracyNote: ACCURACY_NOTE,
        sourceNote: SOURCE_NOTE_ACHAEMENID,
      },
      geometry,
    });
  }

  // ----- 写入文件：原位替换 target features，尽量保持 JSON 顺序稳定 -----
  const existing = JSON.parse(await readFile(OUT, 'utf8'));
  const generatedById = new Map();
  for (const feature of newFeatures) {
    const list = generatedById.get(feature.properties.id) || [];
    list.push(feature);
    generatedById.set(feature.properties.id, list);
  }
  const inserted = new Set();
  const features = [];
  for (const feature of existing.features) {
    const id = feature.properties?.id;
    if (!TARGET_IDS.has(id)) {
      features.push(feature);
      continue;
    }
    if (!inserted.has(id)) {
      features.push(...(generatedById.get(id) || []));
      inserted.add(id);
    }
  }
  for (const [id, list] of generatedById.entries()) {
    if (!inserted.has(id)) features.push(...list);
  }
  const merged = {
    type: 'FeatureCollection',
    features,
  };
  await writeFile(OUT, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\nWrote ${merged.features.length} features (${merged.features.length - newFeatures.length} other + ${newFeatures.length} new) → ${new URL(OUT).pathname}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
