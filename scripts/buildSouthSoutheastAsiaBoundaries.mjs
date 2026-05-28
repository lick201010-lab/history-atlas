// Generator for the 43-civilization expansion · batch 4: South / Southeast Asia.
//
// Same coast-hugging MultiPolygon approach as earlier batches. The Indian
// subcontinent is built from regional blocks (north plain, Deccan, south tip,
// Sri Lanka) that follow the real peninsula outline; mainland SE Asia hugs the
// Gulf of Thailand and South China Sea coasts; and the Srivijaya thalassocracy
// is separate island blocks (Sumatra / Malay peninsula / west Java) so the
// Malacca and Sunda straits stay sea — never one solid block of ocean.
//
// Replaces every feature whose id is in META; keeps all others untouched,
// incl. the 5 refined samples (tang/roman/islamic/mughal/maya) and earlier
// batches. Rewrites src/data/boundaries-simplified.json as PRETTY JSON.
// No new dependency, no large geo dataset.
//
// Run: node scripts/buildSouthSoutheastAsiaBoundaries.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const META = {
  maurya: { name: '孔雀王朝', color: '#f39c12', capital: '华氏城' },
  gupta: { name: '笈多王朝', color: '#e67e22', capital: '华氏城' },
  chola: { name: '朱罗王朝', color: '#d35400', capital: '坦贾武尔' },
  khmer: { name: '吴哥高棉帝国', color: '#1abc9c', capital: '吴哥' },
  srivijaya: { name: '室利佛逝', color: '#3498db', capital: '巨港' },
};

const ACC_NOTE = '各陆块沿印度半岛、恒河平原、德干、海岸与岛屿轮廓分块绘制，内陆为历史势力近似包络；属沙盘级精度，并非精确历史疆域。';
const SRC = '陆块沿河流/海岸/岛屿贴近真实地理轮廓，疆域包络参考维基百科历史地图与各文明专项历史地图。';

const round = (x) => Math.round(x * 1000) / 1000;

function densify(anchors, perSeg = 2, jitter = 0.07) {
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
// North India: Indus/Gujarat east to Bengal, Himalaya N, Vindhya (~23N) S.
const NORTH_INDIA = [[70.0, 25.0], [72.0, 28.0], [74.5, 30.5], [77.5, 28.8], [80.5, 27.5], [83.5, 26.6], [86.5, 26.2], [88.4, 25.6], [88.6, 24.0], [86.0, 23.3], [83.0, 23.2], [80.0, 22.8], [77.0, 22.8], [74.0, 22.9], [71.5, 23.6], [69.8, 24.2]];
// Deccan plateau (central + south Deccan), between west and east coasts.
const DECCAN = [[73.2, 22.8], [77.0, 22.8], [80.0, 22.8], [83.0, 22.0], [84.2, 19.2], [82.2, 16.6], [80.2, 15.0], [77.6, 14.0], [75.0, 14.0], [74.0, 16.2], [73.6, 19.0], [73.2, 21.0]];
// South India (Tamil + Kerala) to Cape Comorin.
const SOUTH_INDIA = [[74.0, 14.2], [75.2, 14.0], [77.8, 14.0], [80.2, 15.0], [80.3, 13.0], [79.8, 10.2], [79.0, 9.2], [78.0, 8.3], [77.0, 8.0], [76.0, 8.6], [75.0, 11.2], [74.3, 12.6]];
// Sri Lanka.
const SRI_LANKA = [[79.9, 9.6], [80.9, 9.5], [81.9, 8.0], [81.8, 6.4], [80.5, 5.9], [79.9, 7.4], [79.8, 8.6]];
// Indus valley + Arachosia (SE Afghanistan) for Maurya.
const INDUS_NW = [[66.0, 25.0], [68.0, 24.0], [68.6, 26.0], [70.5, 28.5], [72.5, 30.5], [71.2, 32.2], [69.0, 33.2], [66.0, 33.0], [64.0, 31.0], [64.5, 29.0], [66.0, 27.0]];
// Gujarat + Malwa (west India) for Gupta peak.
const GUJARAT_MALWA = [[68.5, 24.0], [70.0, 22.0], [72.0, 20.5], [73.5, 21.0], [74.5, 22.5], [75.0, 24.0], [73.0, 24.6], [70.5, 24.6]];
// Mainland SE Asia (Khmer peak): Cambodia + Mekong + Thailand + S Laos.
// South edge cuts across the top of the Gulf of Thailand so the gulf stays sea.
const KHMER_PEAK = [[98.5, 18.5], [100.0, 19.0], [102.0, 18.5], [104.0, 18.0], [106.0, 16.0], [107.8, 15.0], [108.6, 14.0], [107.5, 11.5], [106.5, 10.5], [105.0, 9.5], [104.0, 10.5], [103.0, 11.0], [101.5, 12.5], [100.5, 13.5], [99.5, 14.5], [99.0, 16.0], [98.5, 17.5]];
// Khmer core (Cambodia + lower Mekong) for rise / decline.
const KHMER_CORE = [[102.0, 14.5], [103.5, 14.6], [105.0, 14.0], [106.5, 13.5], [107.5, 12.0], [106.8, 11.0], [105.5, 10.0], [104.0, 10.8], [103.0, 11.5], [102.3, 12.5]];
// Srivijaya island blocks — straits between them stay sea.
const SUMATRA = [[95.3, 5.5], [98.0, 4.0], [100.0, 2.0], [102.0, 0.2], [104.5, -1.8], [105.8, -3.5], [106.1, -5.2], [105.8, -5.9], [104.2, -5.2], [102.3, -3.2], [100.3, -1.2], [98.5, 1.0], [96.5, 3.5]];
const MALAY_PEN_S = [[100.3, 6.5], [101.6, 6.0], [103.5, 5.0], [104.1, 3.0], [103.6, 1.3], [102.0, 1.8], [100.6, 3.2], [100.2, 5.0]];
const JAVA_W = [[106.0, -6.0], [107.0, -6.0], [108.6, -6.4], [108.0, -7.6], [106.0, -7.3], [105.4, -6.7]];

const DEFS = [
  {
    id: 'maurya', phase: 'rise', phaseLabel: '旃陀罗笈多 · 立国', sy: -322, ey: -298, multi: [NORTH_INDIA, INDUS_NW],
    summary: '旃陀罗笈多逐退希腊驻军，统一恒河平原并西取印度河与阿拉霍西亚。', source: SRC,
  },
  {
    id: 'maurya', phase: 'peak', phaseLabel: '阿育王极盛', sy: -297, ey: -232, multi: [NORTH_INDIA, INDUS_NW, DECCAN],
    summary: '阿育王时孔雀帝国囊括除最南端泰米尔诸国外的整个次大陆，并据印度河西。', source: SRC,
  },
  {
    id: 'maurya', phase: 'decline', phaseLabel: '后期收缩', sy: -231, ey: -185, multi: [NORTH_INDIA],
    summary: '阿育王殁后帝国迅速分裂，疆域收缩回恒河平原本部。', source: SRC,
  },
  {
    id: 'gupta', phase: 'rise', phaseLabel: '笈多立国 · 恒河本部', sy: 320, ey: 375, multi: [NORTH_INDIA],
    summary: '旃陀罗笈多一世至沙摩陀罗笈多，确立以恒河平原为核心的北印度政权。', source: SRC,
  },
  {
    id: 'gupta', phase: 'peak', phaseLabel: '超日王极盛', sy: 376, ey: 470, multi: [NORTH_INDIA, GUJARAT_MALWA, DECCAN],
    summary: '超日王时疆域西并古吉拉特、马尔瓦，南慑德干，北印度进入黄金时代。', source: SRC,
  },
  {
    id: 'gupta', phase: 'decline', phaseLabel: '嚈哒入侵 · 收缩', sy: 471, ey: 550, multi: [NORTH_INDIA],
    summary: '嚈哒（白匈奴）反复入侵后帝国瓦解，势力退回恒河平原。', source: SRC,
  },
  {
    id: 'chola', phase: 'rise', phaseLabel: '朱罗复兴', sy: 848, ey: 985, multi: [SOUTH_INDIA],
    summary: '维阇耶罗一世重建朱罗，立足泰米尔与高韦里河三角洲。', source: SRC,
  },
  {
    id: 'chola', phase: 'peak', phaseLabel: '罗茶罗乍—罗贞陀罗 · 海上扩张', sy: 986, ey: 1070, multi: [SOUTH_INDIA, SRI_LANKA],
    summary: '罗茶罗乍与罗贞陀罗征服斯里兰卡、控南印度，并跨海远征室利佛逝，称霸孟加拉湾。', source: SRC,
  },
  {
    id: 'chola', phase: 'decline', phaseLabel: '后期', sy: 1071, ey: 1279, multi: [SOUTH_INDIA],
    summary: '后期朱罗失斯里兰卡北部与海上优势，退守南印度本部直至为潘地亚所代。', source: SRC,
  },
  {
    id: 'khmer', phase: 'rise', phaseLabel: '吴哥立都', sy: 802, ey: 1000, multi: [KHMER_CORE],
    summary: '阇耶跋摩二世立吴哥，以柬埔寨与下湄公河为核心建立高棉王权。', source: SRC,
  },
  {
    id: 'khmer', phase: 'peak', phaseLabel: '苏利耶跋摩—阇耶跋摩七世极盛', sy: 1001, ey: 1220, multi: [KHMER_PEAK],
    summary: '苏利耶跋摩二世至阇耶跋摩七世时，高棉势力遍及今柬埔寨、泰国大部、南老挝与湄公河下游。', source: SRC,
  },
  {
    id: 'khmer', phase: 'decline', phaseLabel: '后期收缩', sy: 1221, ey: 1431, multi: [KHMER_CORE],
    summary: '泰人诸国兴起后高棉收缩回柬埔寨本部，1431年吴哥弃守。', source: SRC,
  },
  {
    id: 'srivijaya', sy: 650, ey: 1377, multi: [SUMATRA, MALAY_PEN_S, JAVA_W],
    summary: '室利佛逝以巨港为中心，控制苏门答腊、马来半岛南部与西爪哇，扼守马六甲、巽他海峡的海上贸易。',
    source: '海上贸易帝国，控制岛屿与海峡要冲；马六甲、巽他等海峡为其掌控的海路而非陆地领土，故仅绘制岛屿陆块。' + SRC,
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
