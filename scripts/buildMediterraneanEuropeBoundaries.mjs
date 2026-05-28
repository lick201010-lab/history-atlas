// Generator for the 43-civilization expansion · batch 2: Mediterranean & Europe.
//
// Mediterranean empires wrap *around* a sea, so a single envelope ring would
// flood the Aegean / Adriatic / Mediterranean with "land". The fix used here:
// model each realm as a MultiPolygon of separate coast-hugging landmass blocks
// (Anatolia, Balkans, Italy, Iberia, North Africa, Levant, ...). The sea
// between blocks stays sea. Each block edge is densified with small
// deterministic jitter so it reads as a natural rough polygon, never a rectangle.
//
// Replaces every feature whose id is in META; keeps all others untouched,
// including the 5 refined samples (tang/roman/islamic/mughal/maya) and the
// East-Asia batch. Rewrites src/data/boundaries-simplified.json as PRETTY
// (indented) JSON. No new dependency, no large geo dataset.
//
// Run: node scripts/buildMediterraneanEuropeBoundaries.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const META = {
  'greek-city-states': { name: '希腊诸城邦', color: '#ecf0f1', capital: '雅典' },
  byzantine: { name: '拜占庭帝国', color: '#9b59b6', capital: '君士坦丁堡' },
  ottoman: { name: '奥斯曼帝国', color: '#c0392b', capital: '伊斯坦布尔' },
  carolingian: { name: '查理曼帝国', color: '#74b9ff', capital: '亚琛' },
  'holy-roman-empire': { name: '神圣罗马帝国', color: '#dfe6e9', capital: '法兰克福/维也纳' },
  'british-empire': { name: '大英帝国', color: '#0984e3', capital: '伦敦' },
};

const ACC_NOTE = '各陆块沿海方向参考真实海岸轮廓分块绘制，内陆为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';

const round = (x) => Math.round(x * 1000) / 1000;

function densify(anchors, perSeg = 2, jitter = 0.08) {
  const n = anchors.length;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const a = anchors[i];
    const b = anchors[(i + 1) % n];
    out.push([round(a[0]), round(a[1])]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    for (let k = 1; k <= perSeg; k += 1) {
      const t = k / (perSeg + 1);
      const s = Math.sin(i * 13.13 + k * 7.7 + a[0] * 0.5 + a[1] * 0.3) * 43758.5453;
      const r = (s - Math.floor(s)) - 0.5;
      const off = r * 2 * jitter;
      out.push([round(a[0] + dx * t + px * off), round(a[1] + dy * t + py * off)]);
    }
  }
  out.push(out[0].slice());
  return out;
}

// --- Coast-hugging regional blocks (lng, lat), open rings (densify closes). ---
const ANATOLIA = [[26.2, 40.0], [27.5, 41.0], [30.0, 41.1], [33.0, 42.0], [36.0, 41.6], [38.5, 41.0], [41.0, 41.3], [42.5, 40.2], [43.5, 39.2], [42.5, 38.0], [41.0, 37.3], [38.5, 37.2], [36.5, 36.6], [34.5, 36.7], [32.0, 36.4], [30.5, 36.8], [28.6, 37.0], [27.3, 37.2], [26.6, 38.4], [26.3, 39.3]];
const BALKANS = [[13.8, 45.4], [15.5, 44.0], [17.0, 43.0], [18.5, 42.5], [19.5, 41.8], [20.0, 40.3], [21.0, 39.0], [22.5, 38.2], [23.2, 37.9], [23.1, 37.0], [22.5, 36.6], [21.9, 37.3], [21.3, 38.2], [22.0, 39.0], [23.5, 39.5], [24.5, 40.2], [25.8, 40.5], [26.6, 40.4], [27.5, 41.0], [28.2, 41.3], [28.0, 42.2], [27.5, 43.2], [28.2, 43.7], [26.0, 44.0], [23.0, 44.3], [20.0, 44.8], [16.5, 45.3]];
const GREECE_CORE = [[19.6, 39.8], [20.0, 40.2], [21.2, 40.0], [22.6, 40.3], [23.7, 40.3], [24.0, 39.0], [24.3, 38.3], [24.0, 37.8], [23.6, 37.6], [23.2, 37.0], [22.5, 36.5], [21.9, 37.3], [21.2, 38.0], [20.7, 38.8], [20.2, 39.3]];
const IONIA = [[26.3, 38.5], [27.3, 38.4], [27.6, 37.6], [27.3, 37.1], [28.2, 37.0], [27.9, 38.0], [27.1, 39.0], [26.5, 39.2]];
const MAGNA_GRAECIA = [[15.6, 38.0], [16.0, 38.9], [16.6, 39.3], [17.2, 39.0], [18.4, 40.1], [17.3, 40.5], [16.5, 40.2], [15.8, 40.0], [15.6, 39.2], [15.4, 38.5]];
const SICILY = [[12.4, 38.0], [13.5, 38.2], [15.1, 38.3], [15.65, 38.1], [15.4, 37.0], [14.5, 36.65], [13.0, 37.1], [12.45, 37.7]];
const ITALY = [[7.5, 44.0], [7.6, 45.0], [10.0, 46.2], [12.0, 46.5], [13.8, 45.8], [13.4, 44.5], [14.0, 42.8], [15.5, 41.9], [16.5, 41.4], [18.4, 40.1], [17.0, 40.0], [16.4, 39.0], [17.0, 38.9], [15.7, 38.0], [15.9, 40.0], [14.0, 40.6], [13.0, 41.2], [11.5, 42.3], [10.2, 43.5], [8.8, 44.3]];
const IBERIA_SE = [[-5.6, 36.0], [-4.0, 36.7], [-2.0, 36.8], [-0.7, 37.9], [-1.5, 38.3], [-3.5, 37.6], [-5.0, 37.0]];
const NAFRICA_W = [[-5.6, 35.8], [-2.2, 35.2], [0.0, 36.0], [3.0, 36.9], [6.0, 36.9], [8.0, 37.0], [10.2, 37.0], [11.0, 33.5], [8.0, 34.0], [4.0, 34.5], [0.0, 34.5], [-3.0, 34.0], [-5.5, 33.5]];
const NAFRICA_E = [[11.0, 33.0], [14.0, 32.5], [15.5, 31.0], [20.0, 32.0], [22.5, 33.0], [25.0, 31.8], [27.0, 31.4], [30.0, 31.4], [32.3, 31.2], [34.0, 31.3], [34.0, 29.5], [32.0, 28.0], [29.0, 27.0], [25.0, 27.0], [20.0, 29.0], [15.0, 29.5], [11.0, 30.5]];
const EGYPT = [[25.0, 31.6], [27.0, 31.4], [30.0, 31.4], [32.3, 31.2], [34.0, 31.3], [34.0, 29.5], [33.0, 28.0], [32.5, 24.0], [31.0, 22.0], [29.0, 22.0], [27.0, 25.0], [25.5, 28.0]];
const LEVANT = [[36.0, 36.4], [35.9, 35.0], [35.5, 33.6], [34.9, 32.6], [34.3, 31.3], [34.2, 30.0], [36.0, 30.5], [38.0, 32.0], [38.5, 34.0], [37.8, 35.8], [36.8, 36.5]];
const MESOPOTAMIA = [[38.0, 37.0], [41.0, 37.2], [44.0, 37.0], [46.0, 35.5], [47.5, 33.0], [48.2, 30.2], [47.0, 30.2], [45.0, 31.0], [43.0, 33.0], [40.5, 34.0], [38.5, 35.0]];
const ARABIA_W = [[34.5, 29.0], [36.0, 28.0], [38.5, 25.0], [40.0, 22.0], [42.0, 18.0], [43.5, 17.0], [43.0, 20.0], [41.0, 24.0], [39.0, 27.0], [36.5, 28.5]];
const BALKANS_HUNGARY = [[13.8, 45.4], [15.5, 44.0], [17.0, 43.0], [18.5, 42.5], [19.5, 41.8], [20.0, 40.3], [21.0, 39.0], [22.5, 38.2], [23.2, 37.9], [23.1, 37.0], [22.5, 36.6], [21.9, 37.3], [21.3, 38.2], [22.0, 39.0], [23.5, 39.5], [24.5, 40.2], [25.8, 40.5], [26.6, 40.4], [27.5, 41.0], [28.2, 41.3], [28.0, 42.2], [27.8, 43.5], [28.5, 44.2], [28.0, 45.5], [26.0, 47.5], [22.0, 48.0], [19.0, 47.8], [16.5, 47.0], [16.0, 46.0], [15.0, 45.6]];
const BALKANS_LATE = [[19.5, 41.8], [20.0, 40.3], [21.0, 39.0], [22.5, 38.2], [23.2, 37.9], [23.1, 37.0], [22.5, 36.6], [21.9, 37.3], [21.3, 38.2], [22.0, 39.0], [23.5, 39.5], [24.5, 40.2], [25.8, 40.5], [26.6, 40.4], [27.5, 41.0], [28.2, 41.3], [27.8, 42.3], [26.0, 42.5], [24.0, 42.3], [22.0, 42.0], [20.5, 42.0]];
const FRANCIA = [[-1.5, 46.0], [-1.0, 48.0], [-2.0, 48.6], [-4.7, 48.3], [-1.5, 49.2], [2.0, 51.0], [4.0, 52.2], [7.0, 53.4], [9.0, 54.0], [11.0, 53.5], [11.5, 51.5], [13.0, 50.5], [12.5, 49.0], [13.5, 48.0], [13.0, 46.8], [12.0, 46.2], [11.0, 45.6], [9.5, 45.2], [8.0, 45.0], [7.5, 44.2], [5.0, 43.5], [3.0, 43.0], [3.2, 42.4], [0.7, 42.7], [-1.6, 43.3], [-1.2, 45.0]];
const FRANCIA_LATE = [[-1.5, 46.0], [-1.0, 48.0], [-2.0, 48.6], [-4.7, 48.3], [-1.5, 49.2], [2.0, 51.0], [4.0, 51.5], [6.5, 51.0], [7.5, 49.5], [8.0, 48.0], [7.5, 47.0], [7.0, 46.0], [6.0, 45.5], [5.0, 44.5], [4.5, 43.5], [3.0, 43.0], [3.2, 42.4], [0.7, 42.7], [-1.6, 43.3], [-1.2, 45.0]];
const HRE_PEAK = [[4.0, 51.0], [5.0, 52.0], [7.0, 53.4], [9.0, 54.0], [11.0, 54.2], [12.5, 54.0], [14.2, 53.8], [15.0, 52.0], [15.2, 50.5], [14.0, 49.0], [13.5, 48.2], [13.0, 47.0], [14.0, 46.5], [13.8, 45.8], [12.5, 45.5], [11.0, 45.4], [9.0, 45.2], [8.0, 45.5], [7.5, 46.0], [6.2, 46.5], [6.0, 48.0], [5.5, 49.5], [4.0, 50.2]];
const HRE_LATE = [[4.0, 51.0], [5.0, 52.0], [7.0, 53.4], [9.0, 54.0], [11.0, 54.2], [12.5, 54.0], [14.2, 53.8], [15.0, 52.0], [15.2, 50.5], [14.0, 49.0], [13.5, 48.2], [13.2, 47.2], [12.0, 47.0], [10.5, 47.3], [9.5, 47.5], [8.0, 47.6], [7.5, 48.5], [7.5, 49.5], [6.0, 50.0], [4.5, 50.4]];
const GREAT_BRITAIN = [[-5.2, 50.1], [-3.0, 51.2], [-5.0, 51.6], [-4.8, 52.8], [-4.1, 53.4], [-3.0, 54.0], [-3.5, 54.9], [-5.0, 55.9], [-5.6, 57.0], [-5.0, 58.3], [-3.0, 58.6], [-2.0, 57.6], [-2.2, 56.7], [-1.5, 55.6], [-0.2, 54.0], [0.4, 53.0], [1.7, 52.8], [1.0, 51.4], [-0.5, 50.8], [-3.5, 50.6]];
const IRELAND = [[-6.2, 52.2], [-8.2, 51.5], [-9.8, 51.6], [-10.2, 53.4], [-9.0, 54.3], [-8.5, 55.3], [-6.5, 55.2], [-5.9, 54.6], [-6.0, 53.4], [-6.0, 52.6]];

const SRC_CN = '陆块沿海贴近真实海岸线，疆域包络参考维基百科历史地图与各文明专项历史地图。';

const DEFS = [
  {
    id: 'greek-city-states', sy: -800, ey: -338, multi: [GREECE_CORE, IONIA, MAGNA_GRAECIA, SICILY],
    summary: '希腊本土、爱琴海、小亚爱奥尼亚沿岸与南意大利、西西里的城邦及殖民地文化圈。',
    source: '代表希腊城邦及其殖民地文化圈，并非统一政权；黑海沿岸与昔兰尼加等更远殖民点未绘制。' + SRC_CN,
  },
  {
    id: 'byzantine', phase: 'rise', phaseLabel: '东罗马 · 立国', sy: 330, ey: 527, multi: [ANATOLIA, BALKANS, LEVANT, EGYPT],
    summary: '君士坦丁建都后的东罗马，据有巴尔干、安纳托利亚、黎凡特与埃及。', source: SRC_CN,
  },
  {
    id: 'byzantine', phase: 'peak', phaseLabel: '查士丁尼复兴', sy: 528, ey: 640, multi: [ANATOLIA, BALKANS, LEVANT, EGYPT, NAFRICA_W, ITALY, SICILY, IBERIA_SE],
    summary: '查士丁尼一度收复意大利、北非与南西班牙，环地中海重现罗马旧疆。', source: SRC_CN,
  },
  {
    id: 'byzantine', phase: 'decline', phaseLabel: '中后期收缩', sy: 641, ey: 1453, multi: [ANATOLIA, BALKANS],
    summary: '阿拉伯与突厥兴起后帝国大幅收缩，长期以安纳托利亚与巴尔干为核心，终亡于1453。', source: SRC_CN,
  },
  {
    id: 'ottoman', phase: 'rise', phaseLabel: '立国 · 巴尔干扩张', sy: 1299, ey: 1453, multi: [ANATOLIA, BALKANS],
    summary: '奥斯曼自西北安纳托利亚崛起，跨海经略巴尔干，1453年攻陷君士坦丁堡。', source: SRC_CN,
  },
  {
    id: 'ottoman', phase: 'peak', phaseLabel: '苏莱曼极盛', sy: 1454, ey: 1683, multi: [ANATOLIA, BALKANS_HUNGARY, LEVANT, NAFRICA_E, NAFRICA_W, MESOPOTAMIA, ARABIA_W],
    summary: '苏莱曼时代版图横跨巴尔干—匈牙利、安纳托利亚、黎凡特、埃及北非与两河、汉志，1683年抵维也纳城下。', source: SRC_CN,
  },
  {
    id: 'ottoman', phase: 'decline', phaseLabel: '晚期收缩', sy: 1684, ey: 1922, multi: [ANATOLIA, BALKANS_LATE, LEVANT, MESOPOTAMIA],
    summary: '维也纳受挫后帝国渐失匈牙利与大部分巴尔干，收缩至安纳托利亚、黎凡特与两河，终结于1922。', source: SRC_CN,
  },
  {
    id: 'carolingian', phase: 'peak', phaseLabel: '查理曼帝国', sy: 800, ey: 843, rings: FRANCIA,
    summary: '查理曼加冕后法兰克帝国统有高卢、低地、西日耳曼与北意大利。', source: SRC_CN,
  },
  {
    id: 'carolingian', phase: 'decline', phaseLabel: '凡尔登分裂', sy: 844, ey: 888, rings: FRANCIA_LATE,
    summary: '凡尔登条约后帝国三分，本图示意西法兰克与中法兰克核心，东部日耳曼析出。', source: SRC_CN,
  },
  {
    id: 'holy-roman-empire', phase: 'peak', phaseLabel: '霍亨斯陶芬鼎盛', sy: 962, ey: 1250, rings: HRE_PEAK,
    summary: '奥托至霍亨斯陶芬时代，帝国含德意志、勃艮第、波希米亚与北意大利。', source: SRC_CN,
  },
  {
    id: 'holy-roman-empire', phase: 'decline', phaseLabel: '晚期邦国林立', sy: 1251, ey: 1806, rings: HRE_LATE,
    summary: '失意大利、勃艮第后帝国名存实分，以德意志与中欧诸邦为主体直至1806解体。', source: SRC_CN,
  },
  {
    id: 'british-empire', sy: 1707, ey: 1997, multi: [GREAT_BRITAIN, IRELAND],
    summary: '大英帝国本土不列颠群岛；其全球殖民地与自治领此处未在沙盘绘制。',
    source: '仅绘制不列颠群岛本土；印度、北美、澳洲、非洲等海外殖民地与自治领未在沙盘绘制，故不反映帝国全球范围。岛屿轮廓贴近真实海岸线。',
  },
];

function makeFeature(def) {
  const meta = META[def.id];
  let geometry;
  if (def.multi) {
    geometry = { type: 'MultiPolygon', coordinates: def.multi.map((ring) => [densify(ring)]) };
  } else {
    geometry = { type: 'Polygon', coordinates: [densify(def.rings)] };
  }
  const properties = { id: def.id, dynasty: meta.name };
  if (def.phase) { properties.phase = def.phase; properties.phaseLabel = def.phaseLabel; }
  Object.assign(properties, {
    startYear: def.sy,
    endYear: def.ey,
    color: meta.color,
    capital: meta.capital,
    summary: def.summary,
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: ACC_NOTE,
    sourceNote: def.source,
  });
  return { type: 'Feature', properties, geometry };
}

async function main() {
  const fc = JSON.parse(await readFile(DATA, 'utf8'));
  const targetIds = new Set(Object.keys(META));
  const kept = fc.features.filter((f) => !targetIds.has(f.properties?.id));
  const generated = DEFS.map(makeFeature);
  fc.features = [...kept, ...generated];
  // PRETTY (indented) output per requirement.
  await writeFile(DATA, `${JSON.stringify(fc, null, 2)}\n`, 'utf8');

  const counts = {};
  for (const f of generated) {
    const g = f.geometry;
    const v = g.type === 'Polygon'
      ? g.coordinates[0].length
      : g.coordinates.reduce((s, p) => s + p[0].length, 0);
    (counts[f.properties.id] = counts[f.properties.id] || []).push(`${f.properties.phase || '-'}:${v}v(${g.type === 'MultiPolygon' ? g.coordinates.length + 'blk' : '1'})`);
  }
  console.log(`Kept ${kept.length} features, generated ${generated.length}.`);
  for (const [id, info] of Object.entries(counts)) console.log(`  ${id}: ${info.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
