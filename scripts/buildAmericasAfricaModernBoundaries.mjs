// Generator for the 43-civilization expansion · batch 5 (final):
// Americas + West Africa + modern states.
//
// Same coast-hugging approach as earlier batches: anchors hug the real coast
// (Pacific / Gulf of Mexico / Atlantic / China seas) and inland Sahel/Andes
// edges, densified with small deterministic jitter -> natural rough polygons.
// Island/overseas parts use MultiPolygon (Alaska, Hainan, Taiwan).
//
// Replaces every feature whose id is in META; keeps all others untouched,
// incl. the 5 refined samples and earlier batches. Rewrites
// src/data/boundaries-simplified.json as PRETTY JSON. No new dependency.
//
// Run: node scripts/buildAmericasAfricaModernBoundaries.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const META = {
  aztec: { name: '阿兹特克帝国', color: '#d63031', capital: '特诺奇蒂特兰' },
  inca: { name: '印加帝国', color: '#fdcb6e', capital: '库斯科' },
  ghana: { name: '加纳帝国', color: '#f6b93b', capital: '昆比萨利赫' },
  mali: { name: '马里帝国', color: '#f9ca24', capital: '尼亚尼' },
  songhai: { name: '桑海帝国', color: '#e1b12c', capital: '加奥' },
  'united-states': { name: '美国', color: '#74b9ff', capital: '华盛顿' },
  prc: { name: '中华人民共和国', color: '#ff7675', capital: '北京' },
};

const ACC_NOTE = '各陆块沿海岸、河谷与高原/萨赫勒边缘分块绘制，内陆为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';
const SRC = '陆块沿海岸/地形贴近真实地理轮廓，疆域包络参考维基百科历史地图与各文明专项历史地图。';

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

// --- Blocks (lng, lat), open rings. ---
// Aztec: central Mexico highlands, Pacific (SW) to Gulf of Mexico (E).
const AZTEC = [[-103.0, 19.3], [-101.5, 21.0], [-99.0, 21.0], [-97.2, 20.4], [-96.1, 19.0], [-95.0, 16.6], [-96.6, 15.8], [-98.6, 16.5], [-100.6, 17.0], [-102.2, 18.0], [-103.2, 18.6]];
// Inca core (Cusco + south Peru + Titicaca) for the rise phase.
const INCA_RISE = [[-76.5, -12.2], [-75.0, -13.5], [-73.5, -15.0], [-71.5, -17.3], [-69.3, -17.0], [-68.8, -14.5], [-70.5, -12.5], [-72.5, -11.3], [-74.5, -11.2]];
// Inca peak (Tahuantinsuyu): Ecuador to central Chile along the Andes + coast.
const INCA_PEAK = [[-79.0, 1.0], [-80.5, -2.0], [-80.5, -4.5], [-79.5, -7.0], [-78.8, -9.0], [-77.4, -12.2], [-76.0, -14.5], [-74.2, -16.2], [-71.5, -17.5], [-70.5, -19.0], [-70.0, -21.0], [-70.5, -25.0], [-71.0, -30.0], [-71.5, -35.0], [-70.0, -35.0], [-66.0, -25.0], [-65.0, -22.0], [-64.5, -18.0], [-66.0, -14.0], [-69.0, -12.0], [-70.5, -10.0], [-72.0, -5.0], [-77.5, -0.5]];
// Ghana: inland West African Sahel (upper Senegal/Niger), no coast.
const GHANA = [[-12.0, 16.5], [-9.0, 17.0], [-6.0, 17.0], [-4.0, 16.5], [-3.5, 14.5], [-5.0, 13.0], [-8.0, 12.5], [-11.0, 13.5], [-12.5, 15.0]];
// Mali peak (Mansa Musa): Atlantic Senegambia coast east to the Niger bend.
const MALI_PEAK = [[-16.0, 16.2], [-16.5, 13.0], [-15.0, 12.0], [-11.0, 11.0], [-8.0, 10.2], [-5.0, 11.0], [-2.0, 13.0], [0.5, 15.5], [-1.0, 17.0], [-5.0, 17.2], [-9.0, 17.0], [-13.0, 16.8]];
// Mali decline: upper Niger/Senegal core after Songhai rose.
const MALI_DECLINE = [[-13.0, 15.0], [-9.0, 15.6], [-5.0, 15.0], [-3.0, 14.0], [-4.0, 11.5], [-8.0, 10.2], [-12.0, 11.0], [-14.0, 13.0]];
// Songhai: Niger bend, Gao-centered, into the Sahara salt routes.
const SONGHAI = [[-6.0, 17.5], [-2.0, 18.5], [2.0, 18.0], [4.0, 16.5], [3.0, 14.5], [0.0, 13.5], [-4.0, 13.0], [-8.0, 13.5], [-10.0, 15.0], [-8.0, 16.6]];
// United States — eastern + Louisiana for the rise phase.
const US_RISE = [[-67.0, 45.0], [-71.0, 41.5], [-74.0, 40.0], [-75.5, 37.0], [-76.0, 35.0], [-81.0, 31.0], [-80.5, 25.5], [-83.0, 29.0], [-87.0, 30.0], [-90.0, 29.0], [-94.0, 29.5], [-97.0, 28.0], [-100.0, 29.0], [-104.0, 32.0], [-104.0, 41.0], [-104.0, 49.0], [-95.0, 49.0], [-90.0, 47.5], [-84.0, 45.5], [-83.0, 42.0], [-79.0, 43.5], [-76.5, 44.5], [-71.0, 45.5]];
// United States — continental 48 (peak, coast to coast).
const US_CONT = [[-67.0, 45.0], [-71.0, 41.5], [-74.0, 40.0], [-75.5, 37.0], [-76.0, 35.0], [-81.0, 31.0], [-80.5, 25.5], [-83.0, 29.0], [-87.0, 30.0], [-90.0, 29.0], [-94.0, 29.5], [-97.0, 26.0], [-99.0, 27.0], [-101.0, 29.5], [-103.0, 29.0], [-106.0, 31.8], [-108.2, 31.3], [-111.0, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-120.5, 34.5], [-122.0, 37.0], [-124.2, 40.0], [-124.0, 46.0], [-123.0, 48.5], [-95.0, 49.0], [-83.0, 42.0], [-79.0, 43.0], [-76.5, 44.5], [-71.0, 45.5]];
const ALASKA = [[-141.0, 60.0], [-141.0, 69.5], [-156.0, 71.0], [-166.0, 68.5], [-168.0, 65.5], [-164.0, 60.5], [-158.0, 58.0], [-153.0, 57.5], [-159.0, 55.5], [-165.0, 54.5], [-157.0, 56.8], [-150.0, 59.5], [-145.0, 60.2]];
// PRC — modern China mainland.
const PRC_MAIN = [[74.5, 38.5], [80.0, 42.0], [85.0, 45.0], [90.0, 47.0], [95.0, 49.0], [100.0, 49.5], [105.0, 50.0], [110.0, 49.0], [115.0, 49.5], [120.0, 50.5], [125.0, 53.0], [127.0, 50.0], [130.0, 48.5], [134.0, 48.0], [135.0, 45.0], [131.0, 43.0], [130.5, 42.5], [128.0, 41.8], [125.2, 40.5], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [113.8, 22.2], [110.5, 21.2], [108.6, 21.6], [105.2, 23.0], [101.5, 22.4], [99.0, 24.0], [97.5, 28.0], [98.5, 33.0], [95.0, 35.0], [91.0, 27.5], [85.0, 28.2], [80.0, 30.5], [78.5, 33.5], [76.0, 36.0], [74.5, 37.5]];
const HAINAN = [[108.6, 20.0], [110.6, 20.1], [111.0, 19.2], [110.0, 18.2], [108.7, 19.1]];
const TAIWAN = [[120.1, 23.0], [120.9, 22.0], [121.0, 22.6], [121.6, 24.0], [121.8, 25.1], [121.0, 25.2], [120.2, 24.2], [120.0, 23.4]];

const DEFS = [
  {
    id: 'aztec', sy: 1428, ey: 1521, multi: [AZTEC],
    summary: '阿兹特克三国同盟以特诺奇蒂特兰为核心，势力跨墨西哥中部高原，西抵太平洋、东达墨西哥湾。', source: SRC,
  },
  {
    id: 'inca', phase: 'rise', phaseLabel: '印加立国 · 库斯科', sy: 1438, ey: 1471, multi: [INCA_RISE],
    summary: '帕查库特克自库斯科崛起，控有南秘鲁安第斯山地与的的喀喀湖区。', source: SRC,
  },
  {
    id: 'inca', phase: 'peak', phaseLabel: '帕查库特克—瓦伊纳·卡帕克 · 极盛', sy: 1472, ey: 1533, multi: [INCA_PEAK],
    summary: '印加帝国沿安第斯山脉北抵厄瓜多尔、南达智利中部，为前哥伦布美洲最大帝国。', source: SRC,
  },
  {
    id: 'ghana', sy: 300, ey: 1200, multi: [GHANA],
    summary: '加纳帝国位于西非萨赫勒，控上塞内加尔—尼日尔间黄金与食盐贸易，都昆比萨利赫。', source: SRC,
  },
  {
    id: 'mali', phase: 'peak', phaseLabel: '曼萨·穆萨极盛', sy: 1235, ey: 1450, multi: [MALI_PEAK],
    summary: '马里帝国曼萨·穆萨时西抵大西洋塞内冈比亚，东控尼日尔河湾的廷巴克图与杰内。', source: SRC,
  },
  {
    id: 'mali', phase: 'decline', phaseLabel: '后期衰落', sy: 1451, ey: 1670, multi: [MALI_DECLINE],
    summary: '桑海兴起后马里收缩回上尼日尔—塞内加尔核心，渐为属国与邻邦蚕食。', source: SRC,
  },
  {
    id: 'songhai', sy: 1464, ey: 1591, multi: [SONGHAI],
    summary: '桑海帝国以加奥为都，阿斯基亚时代沿尼日尔河湾扩张，北控撒哈拉盐道，称霸西非。', source: SRC,
  },
  {
    id: 'united-states', phase: 'rise', phaseLabel: '建国 · 十三州与路易斯安那', sy: 1776, ey: 1850, multi: [US_RISE],
    summary: '美国独立后由东海岸十三州起步，经路易斯安那购地向密西西比河以西扩展。', source: SRC,
  },
  {
    id: 'united-states', phase: 'peak', phaseLabel: '横贯大陆', sy: 1851, ey: 2025, multi: [US_CONT, ALASKA],
    summary: '经领土扩张后美国本土横贯北美大陆，东濒大西洋、西临太平洋，另有阿拉斯加等。', source: '本土48州与阿拉斯加按真实海岸/边界绘制，夏威夷等岛屿此处未绘制。' + SRC,
  },
  {
    id: 'prc', sy: 1949, ey: 2025, multi: [PRC_MAIN, HAINAN, TAIWAN],
    summary: '中华人民共和国疆域含中国本部、东北、内蒙古、新疆、西藏与海南、台湾等，东濒太平洋诸海。', source: SRC,
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
