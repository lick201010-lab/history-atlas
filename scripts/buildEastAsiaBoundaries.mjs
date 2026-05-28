// One-off generator for the East Asia civilization boundary refinement
// (43-civilization expansion · batch 1: China & East Asia).
//
// Strategy: hand-pick ordered geographic anchor points that outline each
// dynasty's approximate sphere of control (eastern edges hug the real coast
// so polygons do not bleed into the sea), then densify each edge with small
// deterministic jitter so the result reads as a natural rough polygon rather
// than a rectangle. No new dependency, no large geo dataset.
//
// It rewrites src/data/boundaries-simplified.json: every feature whose id is
// in TARGET_IDS is replaced; all other features (incl. the 5 refined samples
// tang/roman/islamic/mughal/maya and every non-East-Asian dynasty) are kept
// untouched.
//
// Run: node scripts/buildEastAsiaBoundaries.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const META = {
  xia: { name: '夏朝', color: '#d8b46a', capital: '二里头' },
  shang: { name: '商朝', color: '#c88b5a', capital: '殷' },
  zhou: { name: '周朝', color: '#b9a15f', capital: '镐京/洛邑' },
  qin: { name: '秦朝', color: '#8e44ad', capital: '咸阳' },
  han: { name: '汉朝', color: '#c0392b', capital: '长安/洛阳' },
  jin: { name: '晋朝', color: '#a86454', capital: '洛阳/建康' },
  sui: { name: '隋朝', color: '#7f8c8d', capital: '大兴城' },
  song: { name: '宋朝', color: '#2980b9', capital: '汴京/临安' },
  yuan: { name: '元朝', color: '#16a085', capital: '大都' },
  ming: { name: '明朝', color: '#e74c3c', capital: '南京/北京' },
  qing: { name: '清朝', color: '#2ecc71', capital: '北京' },
  joseon: { name: '朝鲜王朝', color: '#95a5a6', capital: '汉城' },
  'yamato-japan': { name: '日本大和/律令国家', color: '#e84393', capital: '奈良/平安京' },
  'mongol-empire': { name: '蒙古帝国', color: '#16a085', capital: '哈拉和林' },
};

const ACC_NOTE = '海岸线方向参考 Natural Earth 海岸数据收口，内陆为历史势力的近似包络；属沙盘级精度，并非精确历史疆域。';

const round = (x) => Math.round(x * 1000) / 1000;

// Densify a ring of anchor points: for each edge emit the anchor then `perSeg`
// interpolated points displaced perpendicular by a small deterministic offset,
// so edges look hand-drawn. Returns a closed ring (first point repeated).
function densify(anchors, perSeg = 2, jitter = 0.12) {
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
      const r = (s - Math.floor(s)) - 0.5; // -0.5..0.5, deterministic
      const off = r * 2 * jitter;
      out.push([
        round(a[0] + dx * t + px * off),
        round(a[1] + dy * t + py * off),
      ]);
    }
  }
  out.push(out[0].slice());
  return out;
}

// --- Geometry anchor sets (lng, lat), clockwise, eastern edge along the coast.
const CN_COAST_NOTE = '内陆包络参考谭其骧《中国历史地图集》与维基百科历史地图，沿海方向贴近真实海岸线绘制。';

// shift the northern part of a ring up by `d` latitude (for peak variants)
const liftNorth = (ring, latGate, d) => ring.map(([x, y]) => (y >= latGate ? [x, y + d] : [x, y]));

const XIA = [[108.2, 34.4], [109.4, 36.3], [111.2, 37.6], [113.4, 37.4], [115.3, 36.0], [115.8, 34.4], [114.6, 33.0], [112.4, 32.6], [110.2, 33.0], [108.6, 33.6]];
const SHANG = [[106.6, 34.4], [108.2, 36.9], [110.6, 38.4], [113.2, 38.9], [116.0, 38.5], [118.4, 38.2], [120.2, 37.1], [120.4, 35.8], [118.8, 34.0], [116.8, 32.9], [114.3, 32.2], [111.4, 32.5], [108.6, 33.1]];
const ZHOU_W = [[105.4, 34.0], [107.0, 36.8], [109.8, 38.4], [112.8, 38.9], [115.8, 38.5], [118.4, 38.1], [120.2, 37.0], [119.8, 35.0], [117.8, 33.4], [115.6, 31.9], [112.8, 31.4], [109.8, 31.9], [107.4, 32.6], [105.6, 33.0]];
const ZHOU_E = [[103.2, 33.0], [104.6, 36.4], [107.2, 39.0], [110.6, 40.4], [114.0, 40.4], [117.4, 39.8], [120.0, 39.0], [120.6, 38.0], [120.5, 37.0], [120.2, 35.6], [120.4, 33.8], [121.6, 31.5], [120.0, 29.2], [118.6, 27.2], [116.4, 25.2], [114.0, 23.8], [111.6, 24.6], [108.8, 26.2], [105.6, 28.4], [103.4, 31.0]];
const QIN = [[103.6, 34.2], [105.0, 37.0], [107.6, 39.6], [110.8, 40.6], [113.6, 40.4], [116.6, 40.2], [119.0, 39.2], [120.4, 38.0], [120.5, 36.8], [120.6, 35.4], [120.3, 34.0], [121.7, 31.5], [120.4, 29.0], [119.0, 26.6], [117.2, 24.2], [114.6, 22.8], [112.0, 22.0], [109.4, 21.8], [108.4, 22.6], [106.0, 25.4], [104.2, 28.6], [103.2, 31.4]];
const HAN_RISE = [[103.8, 33.8], [105.2, 36.6], [107.6, 39.0], [110.6, 40.2], [113.6, 40.0], [116.4, 39.8], [118.8, 39.0], [120.2, 37.8], [120.4, 36.6], [120.5, 35.2], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.4, 22.8], [112.4, 23.2], [110.0, 24.6], [107.4, 27.0], [104.6, 30.2], [103.6, 32.4]];
const HAN_PEAK = [[80.0, 40.5], [86.0, 41.5], [92.0, 41.8], [98.0, 41.5], [103.0, 41.2], [108.0, 41.0], [112.0, 41.5], [116.0, 42.0], [120.0, 42.2], [123.5, 41.8], [125.5, 40.5], [126.6, 39.2], [125.2, 38.6], [122.0, 39.0], [120.6, 38.0], [120.5, 36.6], [120.4, 35.0], [120.3, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.6], [111.0, 21.8], [108.6, 21.8], [106.0, 23.8], [103.4, 26.2], [100.0, 29.0], [98.5, 33.0], [97.0, 36.0], [94.0, 38.5], [88.0, 39.5], [83.0, 39.8]];
const HAN_DECLINE = [[95.5, 40.0], [100.0, 41.0], [104.0, 41.2], [108.0, 41.0], [112.0, 41.4], [116.0, 41.8], [120.0, 42.0], [123.2, 41.6], [125.2, 40.2], [125.6, 39.0], [123.0, 39.2], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.2, 22.8], [111.4, 22.6], [108.8, 23.8], [105.8, 26.2], [102.6, 29.6], [99.5, 33.5], [97.0, 36.6], [95.0, 38.6]];
const JIN_W = [[101.0, 38.5], [104.0, 40.2], [108.0, 41.0], [112.0, 41.4], [116.0, 41.6], [120.0, 41.8], [123.0, 41.4], [125.0, 40.0], [125.2, 38.8], [122.6, 39.0], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.2, 22.8], [111.2, 22.0], [108.8, 22.0], [106.0, 24.6], [103.0, 28.0], [100.6, 32.0], [100.0, 35.5]];
const JIN_E = [[103.0, 30.5], [104.5, 32.5], [107.0, 33.4], [110.5, 33.2], [113.5, 33.4], [116.5, 33.2], [119.0, 33.2], [120.3, 33.8], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.2, 22.8], [111.2, 22.0], [108.8, 22.0], [106.2, 24.4], [103.6, 27.2], [102.4, 29.0]];
const SUI = [[100.5, 38.5], [103.5, 40.4], [107.5, 41.2], [111.5, 41.6], [115.5, 41.6], [119.0, 41.4], [122.0, 41.0], [124.2, 40.2], [124.6, 39.6], [122.0, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [110.8, 21.6], [108.6, 21.8], [105.8, 24.2], [102.6, 27.8], [100.4, 32.0], [99.8, 35.5]];
const SONG_N = [[104.0, 34.5], [105.2, 36.4], [107.6, 38.2], [110.6, 39.0], [113.6, 39.2], [116.4, 39.0], [118.6, 38.4], [120.2, 37.4], [120.4, 36.2], [120.5, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [111.0, 21.8], [108.8, 22.0], [106.4, 24.0], [104.6, 27.0], [103.8, 30.5], [103.6, 32.6]];
const SONG_S = [[103.4, 30.0], [104.8, 32.2], [107.4, 33.2], [110.6, 33.0], [113.6, 33.2], [116.6, 33.0], [119.2, 33.2], [120.3, 33.9], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [111.0, 21.8], [108.8, 22.0], [106.4, 24.0], [104.6, 27.0], [103.6, 29.0]];
const YUAN = [[79.0, 38.0], [85.0, 42.0], [91.0, 45.0], [97.0, 48.0], [103.0, 49.5], [110.0, 49.0], [116.0, 48.0], [120.0, 47.0], [124.0, 46.0], [127.0, 47.5], [130.0, 48.0], [131.5, 47.0], [130.0, 44.0], [131.0, 43.0], [130.5, 42.3], [128.0, 41.8], [125.5, 40.6], [124.0, 40.0], [122.0, 39.6], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [113.8, 22.2], [110.6, 21.2], [108.6, 21.6], [105.2, 22.6], [101.0, 22.0], [98.5, 24.0], [97.5, 28.0], [94.0, 29.0], [88.0, 28.0], [82.0, 30.0], [79.5, 33.5]];
const MING_RISE = [[97.0, 40.0], [101.0, 41.5], [105.0, 42.0], [109.0, 42.0], [113.0, 42.2], [117.0, 42.4], [121.0, 43.0], [125.0, 45.0], [128.0, 47.0], [130.0, 48.0], [131.0, 47.0], [130.5, 44.0], [131.0, 43.0], [130.4, 42.3], [127.5, 41.8], [125.0, 40.6], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [110.6, 21.4], [108.4, 21.2], [106.6, 20.0], [105.6, 21.0], [104.0, 23.0], [101.6, 25.4], [99.0, 28.0], [98.5, 32.0], [99.5, 35.5], [97.6, 38.0]];
const MING_PEAK = [[98.0, 39.5], [102.0, 40.6], [106.0, 40.8], [110.0, 40.6], [114.0, 40.8], [117.5, 40.8], [120.5, 40.4], [123.0, 41.6], [124.6, 40.4], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [110.8, 21.4], [108.6, 21.6], [106.0, 23.4], [103.4, 25.8], [101.4, 25.2], [99.0, 27.8], [98.6, 31.6], [99.6, 35.0], [98.0, 37.6]];
const MING_DECLINE = [[99.0, 38.6], [103.0, 39.8], [107.0, 40.2], [111.0, 40.2], [114.5, 40.4], [117.8, 40.4], [120.3, 40.0], [122.4, 40.6], [123.8, 40.0], [121.8, 39.2], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [114.0, 22.4], [110.8, 21.4], [108.6, 21.6], [106.0, 23.4], [103.6, 25.8], [101.6, 25.0], [99.4, 27.6], [99.0, 31.4], [99.8, 34.6], [98.6, 37.0]];
const TAIWAN = [[120.1, 23.0], [120.9, 22.0], [121.0, 22.6], [121.6, 24.0], [121.8, 25.1], [121.0, 25.2], [120.2, 24.2], [120.0, 23.4]];
const QING_RISE = [[93.0, 40.0], [98.0, 42.0], [103.0, 44.0], [108.0, 45.0], [113.0, 46.0], [118.0, 47.0], [122.0, 49.0], [126.0, 52.0], [131.0, 53.0], [135.0, 54.0], [138.0, 53.0], [140.0, 52.0], [137.0, 49.0], [134.0, 47.0], [131.0, 45.0], [130.4, 42.3], [128.0, 41.6], [125.2, 40.4], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [113.8, 22.2], [110.6, 21.2], [108.6, 21.6], [105.2, 22.6], [101.0, 22.0], [98.5, 24.5], [97.6, 28.0], [98.0, 33.0], [96.0, 36.0], [93.5, 38.5]];
const QING_PEAK = [[75.0, 40.0], [80.0, 45.0], [85.0, 47.0], [90.0, 48.0], [95.0, 49.5], [100.0, 51.5], [106.0, 52.0], [112.0, 51.5], [118.0, 51.0], [122.0, 52.5], [126.0, 53.0], [131.0, 53.0], [135.0, 54.0], [138.0, 53.0], [140.0, 52.0], [137.0, 49.0], [134.0, 47.0], [131.0, 45.0], [130.4, 42.3], [128.0, 41.6], [125.2, 40.4], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [113.8, 22.2], [110.6, 21.2], [108.6, 21.6], [105.2, 22.6], [101.0, 22.0], [98.0, 24.5], [95.5, 28.0], [91.0, 27.8], [85.0, 28.2], [80.0, 30.5], [78.5, 33.5], [76.0, 36.0], [74.5, 38.0]];
const QING_DECLINE = [[74.8, 40.0], [80.0, 45.0], [85.0, 47.0], [90.0, 48.0], [95.0, 49.5], [100.0, 51.5], [106.0, 52.0], [112.0, 51.5], [118.0, 51.0], [122.0, 52.0], [125.0, 52.5], [127.0, 51.0], [129.0, 49.5], [130.5, 48.5], [133.0, 48.0], [135.0, 47.5], [131.5, 45.0], [130.6, 42.5], [128.0, 41.6], [125.2, 40.4], [123.5, 40.0], [121.8, 39.4], [120.6, 38.0], [120.5, 36.6], [120.3, 35.0], [120.2, 34.0], [121.7, 31.5], [120.3, 29.0], [118.9, 26.6], [117.0, 24.2], [113.8, 22.2], [110.6, 21.2], [108.6, 21.6], [105.2, 22.6], [101.0, 22.0], [98.0, 24.5], [95.5, 28.0], [91.0, 27.8], [85.0, 28.2], [80.0, 30.5], [78.5, 33.5], [76.0, 36.0], [74.6, 38.0]];
const JOSEON = [[124.9, 40.0], [125.4, 39.6], [125.0, 38.8], [126.6, 37.8], [126.4, 36.9], [126.6, 36.0], [126.4, 35.0], [126.6, 34.3], [127.6, 34.3], [128.6, 34.9], [129.4, 35.5], [129.4, 36.6], [129.6, 37.6], [129.0, 38.4], [128.4, 38.7], [128.7, 39.6], [129.7, 41.2], [130.6, 42.3], [129.0, 42.0], [127.0, 41.6], [125.6, 40.8]];
const HONSHU_W = [[131.0, 34.4], [133.0, 34.2], [135.0, 34.6], [136.8, 34.6], [138.0, 34.8], [139.0, 35.2], [139.6, 36.2], [139.0, 37.0], [138.0, 37.0], [137.0, 37.0], [136.0, 36.6], [135.0, 35.6], [133.4, 35.5], [132.0, 35.4], [131.2, 34.7]];
const HONSHU_FULL = [[131.0, 34.4], [133.0, 34.2], [135.0, 34.6], [136.8, 34.6], [138.9, 34.6], [140.0, 35.0], [140.9, 35.7], [141.0, 37.0], [141.5, 38.3], [141.5, 39.6], [141.0, 41.2], [140.3, 41.4], [139.9, 40.4], [139.7, 39.7], [140.0, 38.5], [139.0, 37.6], [138.0, 37.2], [137.0, 37.2], [136.0, 36.8], [135.0, 35.7], [133.4, 35.5], [132.0, 35.4], [131.2, 34.7]];
const KYUSHU = [[130.4, 33.6], [131.7, 33.3], [131.9, 32.4], [131.4, 31.4], [130.6, 31.0], [130.2, 31.4], [129.8, 32.6], [130.0, 33.3]];
const SHIKOKU = [[132.6, 33.5], [134.2, 33.5], [134.7, 34.0], [134.0, 34.3], [132.9, 34.0]];
const MONGOL = [[36.0, 50.0], [44.0, 52.0], [52.0, 53.0], [60.0, 54.0], [70.0, 55.0], [82.0, 55.5], [92.0, 55.0], [103.0, 52.0], [112.0, 50.0], [118.0, 49.0], [122.0, 48.0], [126.0, 47.0], [128.0, 44.0], [126.0, 42.0], [123.0, 41.0], [120.5, 40.0], [120.6, 38.0], [120.4, 36.0], [120.2, 34.0], [121.5, 31.5], [119.0, 27.0], [116.0, 24.0], [113.5, 22.4], [110.0, 21.4], [108.6, 22.0], [104.0, 24.0], [100.0, 26.0], [97.0, 29.0], [92.0, 31.0], [86.0, 30.0], [80.0, 32.0], [73.0, 35.0], [66.0, 36.0], [60.0, 36.0], [54.0, 37.0], [50.0, 40.0], [48.0, 44.0], [46.0, 46.0], [44.0, 44.0], [42.0, 42.0], [40.0, 45.0], [38.0, 47.0], [36.0, 48.0]];

// Definition list. `rings` is either a single anchor ring (Polygon) or an
// array of anchor rings (MultiPolygon).
const DEFS = [
  { id: 'xia', sy: -2070, ey: -1600, rings: XIA, summary: '夏代以二里头为中心的黄河中游核心区。', source: '夏代势力范围史料稀少，' + CN_COAST_NOTE },
  { id: 'shang', sy: -1600, ey: -1046, rings: SHANG, summary: '商代王畿及其影响所及的黄河中下游平原，东抵渤海、山东丘陵。', source: '参考商代考古文化分布与' + CN_COAST_NOTE },
  { id: 'zhou', phase: 'rise', phaseLabel: '西周 · 宗周王畿', sy: -1046, ey: -771, rings: ZHOU_W, summary: '西周以镐京为中心，控有关中与中原，分封诸侯拱卫。', source: CN_COAST_NOTE },
  { id: 'zhou', phase: 'peak', phaseLabel: '东周 · 诸侯扩张', sy: -770, ey: -256, rings: ZHOU_E, summary: '东周春秋战国，列国向四方拓土，势力南达长江、东抵海岱。', source: CN_COAST_NOTE },
  { id: 'qin', sy: -221, ey: -206, rings: QIN, summary: '秦统一六国后的疆域，北筑长城、南并岭南、西括巴蜀。', source: CN_COAST_NOTE },
  { id: 'han', phase: 'rise', phaseLabel: '西汉初 · 郡国并行', sy: -202, ey: -141, rings: HAN_RISE, summary: '西汉前期承秦之地，郡国并行，尚未大举经营河西与西域。', source: CN_COAST_NOTE },
  { id: 'han', phase: 'peak', phaseLabel: '汉武—东汉初 · 河西西域', sy: -140, ey: 88, rings: HAN_PEAK, summary: '汉武帝以后开河西四郡、通西域、设乐浪，南并南越，疆域极盛。', source: CN_COAST_NOTE },
  { id: 'han', phase: 'decline', phaseLabel: '东汉中后期', sy: 89, ey: 220, rings: HAN_DECLINE, summary: '东汉中后期西域时通时绝，本部仍据河西、辽东与岭南。', source: CN_COAST_NOTE },
  { id: 'jin', phase: 'peak', phaseLabel: '西晋 · 短暂统一', sy: 266, ey: 316, rings: JIN_W, summary: '西晋一度重新统一中国本部，北抵长城、东达辽东。', source: CN_COAST_NOTE },
  { id: 'jin', phase: 'decline', phaseLabel: '东晋 · 偏安江南', sy: 317, ey: 420, rings: JIN_E, summary: '永嘉之乱后东晋偏安江南，以淮河—秦岭一线与北方政权对峙。', source: CN_COAST_NOTE },
  { id: 'sui', sy: 581, ey: 618, rings: SUI, summary: '隋再度统一南北，开凿大运河，疆域含河西与岭南。', source: CN_COAST_NOTE },
  { id: 'song', phase: 'peak', phaseLabel: '北宋', sy: 960, ey: 1126, rings: SONG_N, summary: '北宋据中原与江南，北失燕云、西临西夏，未及河西与云南。', source: CN_COAST_NOTE },
  { id: 'song', phase: 'decline', phaseLabel: '南宋 · 偏安江南', sy: 1127, ey: 1279, rings: SONG_S, summary: '靖康之变后南宋退守淮河以南，与金、蒙古隔江对峙。', source: CN_COAST_NOTE },
  { id: 'yuan', phase: 'rise', phaseLabel: '世祖混一', sy: 1271, ey: 1294, rings: YUAN, summary: '忽必烈定国号大元，统一全国并入吐蕃、云南、漠北。', source: CN_COAST_NOTE },
  { id: 'yuan', phase: 'peak', phaseLabel: '元代全盛', sy: 1295, ey: 1368, rings: liftNorth(YUAN, 44, 0.8), summary: '元代疆域北逾漠北、西括西域、南抵交趾，为东亚空前大一统。', source: CN_COAST_NOTE },
  { id: 'ming', phase: 'rise', phaseLabel: '洪武—永乐 · 北征南拓', sy: 1368, ey: 1424, rings: MING_RISE, summary: '明初设奴儿干都司经略东北，永乐一度收交趾，国势鼎盛。', source: CN_COAST_NOTE },
  { id: 'ming', phase: 'peak', phaseLabel: '明代本部', sy: 1425, ey: 1566, rings: MING_PEAK, summary: '宣德弃交趾后明以长城—辽东为北界，稳守两京十三省本部。', source: CN_COAST_NOTE },
  { id: 'ming', phase: 'decline', phaseLabel: '晚明收缩', sy: 1567, ey: 1644, rings: MING_DECLINE, summary: '晚明东北受后金侵逼，辽东渐失，本部疆界向内收缩。', source: CN_COAST_NOTE },
  { id: 'qing', phase: 'rise', phaseLabel: '入关—康熙 · 定鼎', sy: 1644, ey: 1722, rings: [QING_RISE, TAIWAN], summary: '清入关定鼎，平定三藩、收台湾，统有满洲、漠南与中国本部。', source: CN_COAST_NOTE },
  { id: 'qing', phase: 'peak', phaseLabel: '雍乾盛世 · 极盛', sy: 1723, ey: 1820, rings: [QING_PEAK, TAIWAN], summary: '康雍乾平定准噶尔、回部，纳新疆、漠北、西藏，版图达于极盛。', source: CN_COAST_NOTE },
  { id: 'qing', phase: 'decline', phaseLabel: '晚清', sy: 1821, ey: 1912, rings: [QING_DECLINE, TAIWAN], summary: '晚清外患频仍，先失外东北等地，本部与边疆勉力维系至清亡。', source: CN_COAST_NOTE },
  { id: 'joseon', sy: 1392, ey: 1897, rings: JOSEON, summary: '朝鲜王朝据有朝鲜半岛全境，北以鸭绿江、图们江为界。', source: '半岛海岸贴近真实海岸线，北界参考鸭绿江—图们江一线。' },
  { id: 'yamato-japan', phase: 'rise', phaseLabel: '大和王权', sy: 250, ey: 700, rings: [HONSHU_W, KYUSHU, SHIKOKU], summary: '大和王权以畿内为核心，势力覆盖西、中本州与九州、四国。', source: '日本列岛轮廓贴近真实海岸线绘制。' },
  { id: 'yamato-japan', phase: 'peak', phaseLabel: '律令国家', sy: 701, ey: 1185, rings: [HONSHU_FULL, KYUSHU, SHIKOKU], summary: '律令国家成立后，朝廷经略扩及本州东北，奠定后世日本骨干。', source: '日本列岛轮廓贴近真实海岸线绘制。' },
  { id: 'mongol-empire', sy: 1206, ey: 1368, rings: MONGOL, summary: '蒙古帝国全盛横跨欧亚，自东亚海滨延伸至东欧与波斯。', source: '横跨欧亚的极粗略包络，仅示意蒙古帝国全盛覆盖范围。' },
];

function makeFeature(def) {
  const meta = META[def.id];
  const isMulti = Array.isArray(def.rings[0]?.[0]);
  let geometry;
  if (isMulti) {
    geometry = {
      type: 'MultiPolygon',
      coordinates: def.rings.map((ring) => [densify(ring)]),
    };
  } else {
    geometry = { type: 'Polygon', coordinates: [densify(def.rings)] };
  }
  const properties = {
    id: def.id,
    dynasty: meta.name,
    startYear: def.sy,
    endYear: def.ey,
    color: meta.color,
    capital: meta.capital,
    summary: def.summary,
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: ACC_NOTE,
    sourceNote: def.source,
  };
  if (def.phase) {
    properties.phase = def.phase;
    properties.phaseLabel = def.phaseLabel;
  }
  // keep phase right after dynasty for readability
  const ordered = { id: properties.id, dynasty: properties.dynasty };
  if (def.phase) { ordered.phase = properties.phase; ordered.phaseLabel = properties.phaseLabel; }
  Object.assign(ordered, {
    startYear: properties.startYear,
    endYear: properties.endYear,
    color: properties.color,
    capital: properties.capital,
    summary: properties.summary,
    accuracy: properties.accuracy,
    accuracyLabel: properties.accuracyLabel,
    accuracyNote: properties.accuracyNote,
    sourceNote: properties.sourceNote,
  });
  return { type: 'Feature', properties: ordered, geometry };
}

async function main() {
  const fc = JSON.parse(await readFile(DATA, 'utf8'));
  const targetIds = new Set(Object.keys(META));
  const kept = fc.features.filter((f) => !targetIds.has(f.properties?.id));
  const generated = DEFS.map(makeFeature);
  fc.features = [...kept, ...generated];
  await writeFile(DATA, `${JSON.stringify(fc, null, 0)}\n`, 'utf8');

  // quick self-report
  const counts = {};
  for (const f of generated) {
    const id = f.properties.id;
    const g = f.geometry;
    const v = g.type === 'Polygon'
      ? g.coordinates[0].length
      : g.coordinates.reduce((s, p) => s + p[0].length, 0);
    (counts[id] = counts[id] || []).push(`${f.properties.phase || '-'}:${v}v`);
  }
  console.log(`Kept ${kept.length} features, generated ${generated.length}.`);
  for (const [id, info] of Object.entries(counts)) console.log(`  ${id}: ${info.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
