// Generator for the 43-civilization expansion · batch 3: West Asia / North
// Africa / Ancient Near East.
//
// Same coast-hugging MultiPolygon approach as batch 2: each realm is built
// from separate landmass blocks (Nile ribbon, Mesopotamia, Iran plateau,
// Levant, Anatolia, ...) so the Mediterranean, Red Sea and Persian Gulf stay
// sea, not land. Egypt is a narrow Nile-valley ribbon so it visibly follows
// the river. Edges are densified with small deterministic jitter -> natural
// rough polygons, never rectangles.
//
// Replaces every feature whose id is in META; keeps all others untouched,
// incl. the 5 refined samples (tang/roman/islamic/mughal/maya) and earlier
// batches. Rewrites src/data/boundaries-simplified.json as PRETTY JSON.
// No new dependency, no large geo dataset.
//
// Run: node scripts/buildWestAsiaNorthAfricaBoundaries.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const META = {
  'egypt-old-kingdom': { name: '埃及古王国', color: '#e8c98a', capital: '孟菲斯' },
  'egypt-new-kingdom': { name: '埃及新王国', color: '#f1c40f', capital: '底比斯' },
  babylon: { name: '巴比伦王国', color: '#9b59b6', capital: '巴比伦' },
  assyrian: { name: '亚述帝国', color: '#8e5b3a', capital: '尼尼微' },
  achaemenid: { name: '阿契美尼德波斯', color: '#27ae60', capital: '波斯波利斯' },
  sasanian: { name: '萨珊波斯', color: '#1abc9c', capital: '泰西封' },
};

const ACC_NOTE = '各陆块沿尼罗河、两河、海岸与高原边缘分块绘制，内陆为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';
const SRC = '陆块沿河流/海岸贴近真实地理轮廓，疆域包络参考维基百科历史地图与各文明专项历史地图。';

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

// --- Regional coast/river-hugging blocks (lng, lat), open rings. ---
// Nile ribbon: delta fan + narrow valley to Aswan (1st cataract ~24N).
const EGYPT_NILE = [[29.8, 31.0], [30.5, 31.5], [31.6, 31.4], [32.2, 31.1], [31.9, 29.5], [31.8, 27.5], [32.4, 26.0], [33.1, 25.0], [33.4, 24.0], [32.6, 24.0], [32.0, 25.0], [31.5, 26.0], [31.0, 27.5], [30.6, 29.5], [30.2, 30.6]];
// Nile ribbon extended south to Nubia (4th cataract ~18.5N) for New Kingdom.
const EGYPT_NUBIA = [[29.8, 31.0], [30.5, 31.5], [31.6, 31.4], [32.2, 31.1], [31.9, 29.5], [31.8, 27.5], [32.4, 26.0], [33.1, 25.0], [33.4, 24.0], [33.0, 22.0], [32.6, 20.0], [32.3, 18.6], [31.4, 18.6], [31.0, 20.0], [30.8, 22.0], [31.4, 24.0], [31.4, 25.0], [31.2, 26.0], [31.0, 27.5], [30.6, 29.5], [30.2, 30.6]];
// Nile delta down to Thebes (~25.7N) for Assyrian brief conquest.
const NILE_LOWER = [[29.8, 31.0], [30.5, 31.5], [31.6, 31.4], [32.2, 31.1], [31.9, 29.5], [32.2, 27.5], [32.9, 25.3], [31.8, 25.3], [31.3, 27.5], [31.0, 29.5], [30.2, 30.6]];
// Levant: Canaan + Syria, coast west to Euphrates east.
const LEVANT = [[34.3, 31.3], [34.9, 32.6], [35.5, 33.6], [35.9, 35.0], [36.0, 36.2], [38.0, 36.0], [40.0, 35.0], [40.5, 34.0], [39.0, 32.5], [37.0, 31.0], [35.0, 30.0]];
// Lower Mesopotamia (Babylonia core): middle Tigris/Euphrates down to the Gulf.
const MESO_LOWER = [[41.5, 34.8], [43.5, 34.2], [45.0, 33.4], [46.3, 32.4], [47.6, 31.0], [48.2, 30.2], [47.4, 29.9], [45.8, 30.6], [44.2, 31.6], [42.8, 32.8], [41.2, 33.8]];
// Full Mesopotamia (upper + lower).
const MESO_FULL = [[38.0, 37.0], [40.0, 37.3], [42.5, 37.2], [44.5, 37.0], [46.2, 35.8], [47.6, 33.5], [48.2, 30.2], [47.4, 29.9], [45.8, 30.6], [44.0, 31.6], [42.5, 32.8], [41.0, 33.8], [39.5, 34.5], [38.5, 35.5]];
// Upper Mesopotamia (Assyrian homeland around Assur / Nineveh).
const MESO_UPPER = [[38.5, 37.2], [40.5, 37.4], [42.5, 37.3], [44.5, 37.0], [45.5, 35.5], [45.0, 34.5], [43.5, 34.0], [42.0, 34.2], [40.0, 34.8], [38.5, 35.6]];
// Western Zagros strip (Assyrian/Persian highland fringe).
const ZAGROS_W = [[45.5, 37.0], [47.0, 36.5], [48.5, 35.0], [48.5, 33.0], [47.5, 33.0], [46.2, 34.5], [45.2, 36.0]];
// Anatolia (Asia Minor), Black Sea N / Aegean W / Mediterranean S.
const ANATOLIA = [[26.2, 40.0], [27.5, 41.0], [30.0, 41.1], [33.0, 42.0], [36.0, 41.6], [38.5, 41.0], [41.0, 41.3], [42.5, 40.2], [43.5, 39.2], [42.5, 38.0], [41.0, 37.3], [38.5, 37.2], [36.5, 36.6], [34.5, 36.7], [32.0, 36.4], [30.5, 36.8], [28.6, 37.0], [27.3, 37.2], [26.6, 38.4], [26.3, 39.3]];
// Iranian plateau: Caspian N shore, Persian Gulf / Makran S shore, to Indus border.
const IRAN_PLATEAU = [[44.0, 37.5], [47.0, 38.5], [50.0, 37.0], [54.0, 37.0], [57.0, 37.5], [60.0, 37.0], [61.0, 35.0], [61.5, 31.0], [62.0, 29.0], [60.0, 27.0], [57.0, 25.5], [54.0, 26.5], [51.0, 28.0], [49.0, 30.0], [48.0, 31.0], [47.0, 33.0], [45.5, 35.0], [44.5, 36.5]];
// Central Asia (Bactria / Sogdiana).
const CENTRAL_ASIA = [[60.0, 37.0], [63.0, 39.0], [66.0, 40.0], [70.0, 40.0], [72.0, 38.0], [71.0, 36.0], [68.0, 35.0], [64.0, 35.5], [61.0, 35.5]];
// Indus valley (NW India) strip.
const INDUS = [[66.5, 25.0], [68.0, 24.2], [68.5, 26.0], [70.0, 28.0], [72.0, 30.0], [73.5, 32.5], [74.0, 34.0], [72.5, 33.5], [71.0, 31.5], [69.0, 29.0], [67.0, 26.5]];

const DEFS = [
  {
    id: 'egypt-old-kingdom', sy: -2686, ey: -2181, multi: [EGYPT_NILE],
    summary: '古王国以孟菲斯为中心，势力沿尼罗河下游与三角洲展开，南抵第一瀑布。',
    source: '埃及核心始终是尼罗河河谷与三角洲，' + SRC,
  },
  {
    id: 'egypt-new-kingdom', phase: 'rise', phaseLabel: '新王国 · 重整', sy: -1550, ey: -1400, multi: [EGYPT_NUBIA],
    summary: '驱逐喜克索斯后新王国重整，南并努比亚至第四瀑布，尚未深入黎凡特。', source: SRC,
  },
  {
    id: 'egypt-new-kingdom', phase: 'peak', phaseLabel: '帝国极盛 · 图特摩斯—拉美西斯', sy: -1399, ey: -1200, multi: [EGYPT_NUBIA, LEVANT],
    summary: '图特摩斯三世至拉美西斯时代，北控黎凡特至幼发拉底河，南达努比亚，国势极盛。', source: SRC,
  },
  {
    id: 'egypt-new-kingdom', phase: 'decline', phaseLabel: '后期收缩', sy: -1199, ey: -1070, multi: [EGYPT_NUBIA],
    summary: '海上民族冲击与王权衰落后退出黎凡特，疆域收回尼罗河与努比亚。', source: SRC,
  },
  {
    id: 'babylon', phase: 'rise', phaseLabel: '古巴比伦 · 汉谟拉比', sy: -1894, ey: -1000, multi: [MESO_LOWER],
    summary: '古巴比伦以汉谟拉比为代表，统有两河下游的苏美尔—阿卡德故地。', source: SRC,
  },
  {
    id: 'babylon', phase: 'peak', phaseLabel: '新巴比伦 · 尼布甲尼撒', sy: -999, ey: -539, multi: [MESO_FULL, LEVANT],
    summary: '新巴比伦尼布甲尼撒二世灭亚述、并黎凡特，势力遍及两河全境，终亡于波斯。', source: SRC,
  },
  {
    id: 'assyrian', phase: 'rise', phaseLabel: '中亚述 · 本土', sy: -1365, ey: -912, multi: [MESO_UPPER],
    summary: '中亚述时期以亚述、尼尼微为核心，据有两河上游本土。', source: SRC,
  },
  {
    id: 'assyrian', phase: 'peak', phaseLabel: '新亚述极盛', sy: -911, ey: -609, multi: [MESO_FULL, LEVANT, NILE_LOWER, ZAGROS_W],
    summary: '新亚述帝国并两河、黎凡特与西扎格罗斯，鼎盛期一度征服下埃及至底比斯。', source: SRC,
  },
  {
    id: 'achaemenid', phase: 'rise', phaseLabel: '居鲁士开国', sy: -550, ey: -522, multi: [IRAN_PLATEAU, MESO_FULL, ANATOLIA],
    summary: '居鲁士兼并米底、吕底亚与巴比伦，奠定横跨伊朗高原、两河与安纳托利亚的帝国。', source: SRC,
  },
  {
    id: 'achaemenid', phase: 'peak', phaseLabel: '大流士极盛', sy: -521, ey: -486, multi: [IRAN_PLATEAU, MESO_FULL, ANATOLIA, LEVANT, EGYPT_NILE, CENTRAL_ASIA, INDUS],
    summary: '大流士一世时帝国西括埃及、安纳托利亚，东抵印度河与中亚，为古代第一大帝国。', source: SRC,
  },
  {
    id: 'achaemenid', phase: 'decline', phaseLabel: '后期', sy: -485, ey: -330, multi: [IRAN_PLATEAU, MESO_FULL, ANATOLIA, LEVANT, EGYPT_NILE, CENTRAL_ASIA],
    summary: '希波战争后帝国疆域大体维持，埃及屡叛，终为亚历山大所灭。', source: SRC,
  },
  {
    id: 'sasanian', phase: 'rise', phaseLabel: '萨珊立国', sy: 224, ey: 530, multi: [IRAN_PLATEAU, MESO_FULL],
    summary: '阿尔达希尔与沙普尔立国，据有伊朗高原与两河，与罗马长期对峙。', source: SRC,
  },
  {
    id: 'sasanian', phase: 'peak', phaseLabel: '霍斯劳二世西扩', sy: 531, ey: 628, multi: [IRAN_PLATEAU, MESO_FULL, LEVANT, EGYPT_NILE],
    summary: '霍斯劳二世一度攻取黎凡特与埃及，疆域西抵地中海，为萨珊最大扩张。', source: SRC,
  },
  {
    id: 'sasanian', phase: 'decline', phaseLabel: '末期崩解', sy: 629, ey: 651, multi: [IRAN_PLATEAU, MESO_FULL],
    summary: '与罗马两败俱伤后退回伊朗与两河，旋即为阿拉伯征服所灭。', source: SRC,
  },
];

function makeFeature(def) {
  const meta = META[def.id];
  const geometry = def.multi
    ? { type: 'MultiPolygon', coordinates: def.multi.map((ring) => [densify(ring)]) }
    : { type: 'Polygon', coordinates: [densify(def.rings)] };
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
  await writeFile(DATA, `${JSON.stringify(fc, null, 2)}\n`, 'utf8');

  const counts = {};
  for (const f of generated) {
    const g = f.geometry;
    const v = g.type === 'Polygon' ? g.coordinates[0].length : g.coordinates.reduce((s, p) => s + p[0].length, 0);
    (counts[f.properties.id] = counts[f.properties.id] || []).push(`${f.properties.phase || '-'}:${v}v(${g.type === 'MultiPolygon' ? g.coordinates.length + 'blk' : '1'})`);
  }
  console.log(`Kept ${kept.length} features, generated ${generated.length}.`);
  for (const [id, info] of Object.entries(counts)) console.log(`  ${id}: ${info.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
