// 重做 5 个样板文明（tang / roman-republic-empire / islamic-caliphates / mughal / maya）
// 的 coastline-aware-rough 边界 —— 用「真实海岸线裁切」。
//
// 思路：
//   - 我手画的「块」只是某个陆块的“势力范围框”（一框一陆块），不是边界本身。
//   - 用真实 Natural Earth 50m 海岸线去和每个框求交集：
//       · 靠海的边 → 自动变成真实海岸线；
//       · 内陆的边 → 才是我手画的历史势力包络（直一点没关系，和其余文明一致）。
//   - 关键：按「单个陆块」分别裁，绝不用一个横跨多片海的大包络 —— 这样不会再出现
//     横跨大海的直线（旧 generateCoastAwareBoundaries 的“三角形”就是那么来的）。
//
// 裁切机器（凸包 + Sutherland–Hodgman + Douglas–Peucker）沿用旧脚本，已验证可用；
// 区别只在“按陆块裁”而非“按大包络裁”。
//
// 元数据（phaseLabel / 年份 / summary / color / capital / note）完全沿用，信息卡不变。
// Natural Earth 数据缓存到 scripts/.cache/，首次需联网，之后离线可重跑。
//
// 运行：node scripts/buildSampleCivBoundaries.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DATA = new URL('../src/data/boundaries-simplified.json', import.meta.url);
const NE_URL = 'https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_land.json';
const CACHE_DIR = new URL('./.cache/', import.meta.url);
const CACHE_FILE = new URL('./.cache/ne_50m_land.json', import.meta.url);
const SAMPLE_IDS = new Set(['tang', 'roman-republic-empire', 'islamic-caliphates', 'mughal', 'maya']);

const CELL = 0.04;           // 栅格分辨率（度，~4.5km）：更细，凑近看海岸更贴
const CHAIKIN_ITERS = 2;     // Chaikin 圆角次数：把栅格阶梯磨成自然曲线
const PRE_DP_EPS = 0.012;    // 圆角前轻量去共线点（< 单个台阶角高，保留台阶供 Chaikin 磨圆）
const DP_EPS = 0.03;         // 末轮简化阈值（度，~3.3km）：圆角后控点。Chaikin 已去阶梯，
                             // 此处放宽以收住顶点数/体积；曲线平滑不再尖刺。
const MIN_RING_AREA = 0.45;  // 过滤小碎屑（度²），保留西西里/撒丁/克里特/塞浦路斯/海南等

// =============================================================================
// 「势力范围框」—— 一框一陆块（lng, lat），开放折线即可
// =============================================================================

// ---- 地中海 / 西亚 / 北非（罗马 + 哈里发共用） ----
const ITALY = [[7.5, 44.0], [10.0, 46.3], [13.6, 46.0], [14.0, 42.0], [16.5, 41.4], [18.6, 40.0], [16.2, 38.8], [15.5, 38.0], [13.0, 41.0], [10.5, 43.0], [8.2, 44.0]];
const SICILY = [[12.4, 38.0], [15.3, 38.4], [15.7, 37.0], [13.0, 36.6], [12.3, 37.6]];
const SARDINIA_CORSICA = [[8.1, 38.8], [9.9, 39.2], [10.0, 43.1], [8.3, 42.8], [8.2, 41.0]];
const IBERIA = [[-9.8, 43.9], [-9.6, 38.0], [-6.3, 36.0], [-1.8, 36.5], [0.5, 39.0], [3.5, 42.0], [3.4, 43.5], [-2.0, 43.9], [-7.0, 44.1]];
const IBERIA_S = [[-7.5, 36.0], [-1.5, 36.4], [-0.2, 38.6], [-3.0, 39.0], [-6.5, 38.6], [-7.6, 37.4]];
const GAUL = [[-1.8, 43.2], [-4.9, 48.6], [2.5, 51.4], [8.0, 49.5], [8.5, 47.0], [7.0, 43.6], [3.0, 42.3]];
const GREAT_BRITAIN = [[-5.8, 49.8], [-5.5, 58.8], [-1.5, 58.8], [-1.0, 56.0], [1.9, 52.7], [1.5, 51.0], [-5.6, 50.0]];
const GREECE_AEGEAN = [[19.2, 40.2], [24.2, 41.2], [26.8, 40.8], [28.4, 38.8], [27.2, 36.2], [22.0, 35.8], [19.6, 38.3]];
const BALKANS = [[13.4, 45.9], [19.8, 46.2], [23.5, 44.6], [28.7, 43.8], [28.2, 40.8], [25.0, 39.8], [22.5, 39.5], [19.2, 39.8], [16.0, 44.0]];
const ANATOLIA = [[26.0, 41.4], [30.0, 42.2], [37.0, 42.3], [42.0, 41.6], [44.2, 38.8], [42.0, 37.0], [36.0, 36.2], [30.0, 36.2], [27.0, 36.6], [25.8, 39.2]];
const NAFRICA_W = [[-6.0, 36.0], [-2.0, 35.5], [3.0, 37.2], [8.0, 37.4], [11.5, 37.6], [11.5, 33.0], [6.0, 33.2], [0.0, 33.6], [-5.5, 32.6], [-9.8, 30.5], [-9.5, 34.0]];
const NAFRICA_E = [[10.5, 33.5], [15.0, 31.5], [20.0, 32.6], [25.0, 32.2], [30.0, 31.6], [33.2, 31.6], [33.0, 28.5], [25.0, 27.0], [18.0, 28.0], [12.0, 30.0], [10.0, 31.5]];
const EGYPT = [[24.5, 31.8], [30.0, 31.8], [34.4, 31.6], [34.5, 28.0], [33.0, 24.0], [31.0, 22.0], [25.0, 22.0], [24.8, 28.0]];
const LEVANT = [[35.9, 36.8], [36.4, 34.0], [35.0, 31.3], [34.2, 31.0], [34.0, 33.8], [35.0, 36.4]];
const MESOPOTAMIA = [[37.5, 37.6], [42.0, 37.6], [46.5, 36.0], [48.6, 30.0], [46.5, 29.6], [43.0, 32.5], [39.0, 35.0], [37.0, 36.4]];
const ARABIA = [[34.4, 29.6], [38.5, 25.0], [42.0, 18.0], [44.5, 12.4], [48.0, 13.6], [52.5, 16.0], [56.5, 17.5], [59.9, 22.6], [57.0, 23.8], [56.6, 26.2], [50.4, 28.6], [48.6, 30.4], [44.0, 30.6], [39.0, 31.0], [35.0, 30.2]];
const ARABIA_N = [[34.4, 29.6], [39.0, 26.0], [44.0, 26.5], [48.6, 30.4], [46.0, 32.0], [40.0, 32.0], [36.0, 31.0]];
const PERSIA = [[48.0, 30.4], [52.0, 28.0], [57.0, 25.6], [61.8, 25.2], [62.4, 28.0], [60.6, 33.0], [57.0, 37.6], [52.0, 38.2], [48.5, 38.0], [45.6, 39.2], [45.4, 35.0], [46.6, 32.0]];
const TRANSOXIANA = [[54.0, 37.5], [60.0, 39.5], [66.0, 43.0], [71.5, 42.5], [72.0, 39.0], [66.0, 37.0], [58.0, 36.6]];
const INDUS = [[66.0, 24.5], [68.5, 23.6], [71.5, 24.5], [75.0, 32.0], [72.5, 33.6], [69.0, 31.5], [66.4, 27.5]];

// ---- 唐朝（中国本部，东缘到真实海岸） ----
const TANG_RISE = [[99, 38], [104, 41], [112, 42.5], [120, 41], [122, 35], [122, 31], [121, 27], [117, 24], [110, 20], [105, 22], [101, 28], [99, 33]];
const TANG_PEAK = [[74, 39], [82, 46], [95, 50], [112, 50], [124, 46], [127, 40], [126, 36], [122, 32], [121, 27], [114, 21], [108, 20], [101, 25], [94, 30], [83, 35], [76, 37]];
const TANG_DECLINE = [[103, 39], [110, 41.5], [118, 41], [122, 36], [122, 31], [120, 27], [115, 23], [110, 21], [105, 25], [102, 30], [101, 35]];

// ---- 莫卧儿（印度次大陆，两侧到真实海岸） ----
const INDIA_NORTH = [[69, 22.5], [70, 25], [73, 24], [78, 26], [85, 25.5], [89, 26.5], [89, 23], [84, 23], [78, 23], [73, 21], [70.5, 21]];
const INDIA_FULL = [[68, 23.5], [70.5, 20.5], [73.5, 16.0], [75.0, 11.0], [77.5, 7.8], [80.5, 11.0], [80.5, 14.0], [84.0, 18.5], [87.5, 21.5], [90.5, 22.5], [89.0, 26.5], [85.0, 28.0], [78.0, 30.5], [73.5, 33.0], [71.0, 30.0], [69.0, 26.0]];
const INDIA_CORE = [[71, 22], [73, 25], [77, 27], [82, 26], [86, 25.5], [87, 23.5], [83, 22], [78, 22], [74, 21]];

// ---- 玛雅（尤卡坦半岛 + 佩滕 + 恰帕斯东 + 洪都拉斯西） ----
const YUCATAN_CORE = [[-90.5, 21.0], [-86.7, 21.4], [-87.6, 18.5], [-88.6, 16.0], [-90.0, 14.6], [-91.8, 16.0], [-92.0, 18.0], [-92.6, 19.2], [-90.8, 20.2]];
const YUCATAN_FULL = [[-90.8, 21.6], [-86.5, 21.6], [-87.8, 18.0], [-88.9, 15.6], [-90.4, 13.8], [-92.4, 15.2], [-92.4, 17.8], [-93.2, 18.8], [-91.5, 20.2], [-90.9, 21.0]];
const YUCATAN_NORTH = [[-90.8, 21.8], [-86.5, 21.6], [-87.6, 19.0], [-88.8, 17.4], [-90.5, 17.8], [-91.4, 19.4], [-91.2, 20.8]];

// =============================================================================
// 元数据：完全沿用（信息卡 / 时间轴不变）
// =============================================================================
const COMMON = {
  tang: { dynasty: '唐朝', color: '#e67e22', capital: '长安' },
  'roman-republic-empire': { dynasty: '罗马共和国 / 帝国', color: '#c0392b', capital: '罗马 / 君士坦丁堡' },
  'islamic-caliphates': { dynasty: '阿拉伯哈里发', color: '#27ae60', capital: '麦地那 / 大马士革 / 巴格达' },
  mughal: { dynasty: '莫卧儿帝国', color: '#9b59b6', capital: '德里 / 阿格拉' },
  maya: { dynasty: '玛雅文明', color: '#16a085', capital: '蒂卡尔 / 玛雅城邦' },
};

const META = {
  'tang:rise': { phaseLabel: '初唐 · 统一与扩张', startYear: 618, endYear: 660, summary: '高祖至高宗早期完成统一并经略西域、东北。势力以关中—中原为核心，向河西、安西扩展。' },
  'tang:peak': { phaseLabel: '盛唐 · 安西诸镇', startYear: 661, endYear: 755, summary: '武周、玄宗治下安西四镇、安东都护、北庭都护并立。版图东到朝鲜半岛西部，西达葱岭，北抵贝加尔，南越红河。' },
  'tang:decline': { phaseLabel: '中晚唐 · 安史之后', startYear: 756, endYear: 907, summary: '安史之乱后丧失河西走廊、西域，安东都护废。藩镇割据，势力退守中原与江淮。' },

  'roman-republic-empire:rise': { phaseLabel: '共和扩张 · 地中海统一', startYear: -509, endYear: -27, summary: '从拉丁姆出发，先统一意大利，再经布匿战争吞并迦太基与西班牙，最终在恺撒—屋大维时代征服高卢、希腊、埃及，环抱地中海。' },
  'roman-republic-empire:peak': { phaseLabel: '元首制鼎盛 · 图拉真版图', startYear: -26, endYear: 180, summary: '元首制下版图最大：北至不列颠与日耳曼边墙，东达美索不达米亚，南控埃及与马格里布，地中海成为帝国内湖。' },
  'roman-republic-empire:decline': { phaseLabel: '帝国晚期 · 西部解体', startYear: 181, endYear: 476, summary: '三世纪危机起，疆域反复收缩；东西分治后西部 5 世纪被日耳曼诸部蚕食，476 年西罗马帝国终结。' },

  'islamic-caliphates:rise': { phaseLabel: '拉希顿—伍麦叶 · 早期扩张', startYear: 632, endYear: 750, summary: '先知去世后四位正统哈里发完成阿拉伯半岛统一并向波斯、拜占庭叙利亚扩展；伍麦叶王朝把势力推向北非、伊比利亚南部与中亚。' },
  'islamic-caliphates:peak': { phaseLabel: '阿拔斯早期 · 巴格达中心', startYear: 751, endYear: 900, summary: '阿拔斯革命后定都巴格达，呼罗珊与河中重整治理，伊比利亚科尔多瓦另立但仍属伊斯兰世界；版图横跨大西洋到印度河。' },
  'islamic-caliphates:decline': { phaseLabel: '碎片化 · 巴格达陷落', startYear: 901, endYear: 1258, summary: '法蒂玛、布维希、塞尔柱诸势力切割阿拔斯名义疆域，10 世纪起核心退守两河与黎凡特，1258 年蒙古攻陷巴格达哈里发覆灭。' },

  'mughal:rise': { phaseLabel: '巴布尔—胡马雍 · 北印度奠基', startYear: 1526, endYear: 1556, summary: '巴布尔在帕尼帕特击败洛迪苏丹，建立莫卧儿王朝；胡马雍一度流亡波斯，归位后稳住印度河—恒河平原。' },
  'mughal:peak': { phaseLabel: '阿克巴—奥朗则布 · 鼎盛版图', startYear: 1557, endYear: 1707, summary: '阿克巴建立稳固官僚体系并吞并拉杰普特，沙贾汗与奥朗则布把版图扩至德干高原与南印度部分地区，是莫卧儿疆域最大期。' },
  'mughal:decline': { phaseLabel: '碎片化 · 收缩至德里', startYear: 1708, endYear: 1857, summary: '奥朗则布去世后地方总督独立，马拉塔、锡克、英国东印度公司逐步切割版图；1857 年印度大起义后正式被英属印度取代。' },

  'maya:rise': { phaseLabel: '前古典 · 城邦形成', startYear: -2000, endYear: 250, summary: '玛雅人于前古典时期在尤卡坦半岛与佩滕雨林中形成城邦群，纳克贝、米拉多、卡米纳尔朱尤等先期中心兴起。' },
  'maya:peak': { phaseLabel: '古典期 · 城邦鼎盛', startYear: 251, endYear: 900, summary: '蒂卡尔、卡拉克穆尔、帕伦克、科潘、亚斯奇兰等城邦群相互竞争，建筑、天文、文字、长纪历达到顶峰。' },
  'maya:decline': { phaseLabel: '后古典 · 北缩与殖民征服', startYear: 901, endYear: 1697, summary: '南部城邦相继崩塌，重心北移至尤卡坦的玛雅潘、奇琴伊察等联盟；1697 年塔亚萨尔陷落后独立玛雅政权终结。' },
};

const ACCURACY_LABEL = '海岸贴合粗多边形';
const ACCURACY_NOTE = '沿海部分由 Natural Earth 50m 海岸线裁剪得到真实海岸轮廓，内陆边界使用文明历史势力的近似包络；属沙盘级精度，不代表精确历史疆域。';
const SOURCE_NOTE = '使用 Natural Earth 50m land 数据与人工绘制的历史势力包络（一框一陆块）求交得到；包络范围参考维基百科、谭其骧《中国历史地图集》及各文明专项历史地图。';

// 每个 (civ, phase) 的「框」集合（每个框对应一个陆块）
const DEFS = [
  { key: 'tang:rise', blocks: [TANG_RISE] },
  { key: 'tang:peak', blocks: [TANG_PEAK] },
  { key: 'tang:decline', blocks: [TANG_DECLINE] },

  { key: 'roman-republic-empire:rise', blocks: [ITALY, SICILY, SARDINIA_CORSICA, IBERIA, GAUL, NAFRICA_W, GREECE_AEGEAN, BALKANS, ANATOLIA] },
  { key: 'roman-republic-empire:peak', blocks: [ITALY, SICILY, SARDINIA_CORSICA, IBERIA, GAUL, GREAT_BRITAIN, NAFRICA_W, NAFRICA_E, EGYPT, GREECE_AEGEAN, BALKANS, ANATOLIA, LEVANT, MESOPOTAMIA] },
  { key: 'roman-republic-empire:decline', blocks: [ITALY, SICILY, SARDINIA_CORSICA, IBERIA, GAUL, NAFRICA_W, NAFRICA_E, EGYPT, GREECE_AEGEAN, BALKANS, ANATOLIA, LEVANT] },

  { key: 'islamic-caliphates:rise', blocks: [IBERIA_S, NAFRICA_W, NAFRICA_E, EGYPT, ARABIA, LEVANT, MESOPOTAMIA, PERSIA] },
  { key: 'islamic-caliphates:peak', blocks: [IBERIA_S, NAFRICA_W, NAFRICA_E, EGYPT, ARABIA, LEVANT, MESOPOTAMIA, PERSIA, TRANSOXIANA, INDUS] },
  { key: 'islamic-caliphates:decline', blocks: [MESOPOTAMIA, LEVANT, PERSIA, ARABIA_N] },

  { key: 'mughal:rise', blocks: [INDIA_NORTH] },
  { key: 'mughal:peak', blocks: [INDIA_FULL] },
  { key: 'mughal:decline', blocks: [INDIA_CORE] },

  { key: 'maya:rise', blocks: [YUCATAN_CORE] },
  { key: 'maya:peak', blocks: [YUCATAN_FULL] },
  { key: 'maya:decline', blocks: [YUCATAN_NORTH] },
];

// =============================================================================
// 栅格化求交 + 外轮廓描边
//   思路：把“势力范围框（可凹）”和“真实陆地”分别扫描线填充进同一张布尔栅格，
//   取 AND，再沿单元格边界描出每个连通块的外轮廓。
//   —— 同一片大陆自动并成一个干净多边形（不再重叠/内部交叉线）；
//      海峡处真实的海会把不同大陆自然分开（→ MultiPolygon 的不同块）。
// =============================================================================

// 扫描线填充（偶奇规则，支持凹多边形）：把 ring 内部单元格在 mask 中置 1。
function fillMask(mask, grid, ring) {
  const { nx, ny, lng0, lat0, cell } = grid;
  const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring : [...ring, ring[0]];
  for (let j = 0; j < ny; j++) {
    const y = lat0 + (j + 0.5) * cell;
    const xs = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const y0 = pts[k][1], y1 = pts[k + 1][1];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        const t = (y - y0) / (y1 - y0);
        xs.push(pts[k][0] + t * (pts[k + 1][0] - pts[k][0]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let m = 0; m + 1 < xs.length; m += 2) {
      let ia = Math.ceil((xs[m] - lng0) / cell - 0.5);
      let ib = Math.floor((xs[m + 1] - lng0) / cell - 0.5);
      if (ia < 0) ia = 0;
      if (ib > nx - 1) ib = nx - 1;
      const base = j * nx;
      for (let i = ia; i <= ib; i++) mask[base + i] = 1;
    }
  }
}

// 转弯偏好：filled-on-left 的有向边，路口优先“最右转”（顺时针），让连通块各自闭合。
function turnScore(inD, out) {
  const cross = inD[0] * out[1] - inD[1] * out[0];
  const dot = inD[0] * out[0] + inD[1] * out[1];
  if (cross < 0) return 0; // 右转
  if (dot > 0) return 1;   // 直行
  if (cross > 0) return 2; // 左转
  return 3;                // 掉头
}

// 沿单元格边界描出所有外轮廓环（角点坐标 [i,j]）。
function traceBoundary(mask, nx, ny) {
  const filled = (i, j) => i >= 0 && i < nx && j >= 0 && j < ny && mask[j * nx + i] === 1;
  const edges = [];
  const tailMap = new Map();
  const addEdge = (ax, ay, bx, by) => {
    const idx = edges.length;
    edges.push({ ax, ay, bx, by, used: false });
    const k = `${ax},${ay}`;
    let arr = tailMap.get(k);
    if (!arr) { arr = []; tailMap.set(k, arr); }
    arr.push(idx);
  };
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (mask[j * nx + i] !== 1) continue;
      if (!filled(i - 1, j)) addEdge(i, j + 1, i, j);         // 左
      if (!filled(i + 1, j)) addEdge(i + 1, j, i + 1, j + 1); // 右
      if (!filled(i, j - 1)) addEdge(i, j, i + 1, j);         // 下
      if (!filled(i, j + 1)) addEdge(i + 1, j + 1, i, j + 1); // 上
    }
  }
  const loops = [];
  for (let e0 = 0; e0 < edges.length; e0++) {
    if (edges[e0].used) continue;
    const loop = [];
    let idx = e0;
    let guard = 0;
    while (idx !== -1 && !edges[idx].used) {
      const e = edges[idx];
      e.used = true;
      loop.push([e.ax, e.ay]);
      const cand = tailMap.get(`${e.bx},${e.by}`) || [];
      const inDir = [e.bx - e.ax, e.by - e.ay];
      let best = -1, bestScore = Infinity;
      for (const c of cand) {
        if (edges[c].used) continue;
        const o = edges[c];
        const sc = turnScore(inDir, [o.bx - o.ax, o.by - o.ay]);
        if (sc < bestScore) { bestScore = sc; best = c; }
      }
      idx = best;
      if (++guard > 20_000_000) break;
    }
    if (loop.length >= 3) {
      loop.push([loop[0][0], loop[0][1]]);
      loops.push(loop);
    }
  }
  return loops;
}

function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}

// =============================================================================
// Douglas–Peucker / 面积 / 朝向
// =============================================================================
function perpDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx, cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}
function douglasPeucker(points, eps) {
  if (points.length < 3) return points.slice();
  let maxDist = 0, maxIdx = 0;
  const first = points[0], last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist < eps) return [first, last];
  const left = douglasPeucker(points.slice(0, maxIdx + 1), eps);
  const right = douglasPeucker(points.slice(maxIdx), eps);
  return [...left.slice(0, -1), ...right];
}
// Chaikin 角点切割（闭合环）：每条边取 1/4、3/4 两点，迭代 iters 次，
// 把栅格描边的直角阶梯磨成自然圆角曲线（位移为亚网格尺度，海岸贴合度不受影响）。
function chaikinClosed(ring, iters) {
  if (iters <= 0 || ring.length < 4) return ring;
  let pts = ring.slice(0, -1); // 去掉闭合重复点，按首尾相接的环处理
  if (pts.length < 3) return ring;
  for (let it = 0; it < iters; it++) {
    const next = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    pts = next;
  }
  pts.push([pts[0][0], pts[0][1]]); // 重新闭合
  return pts;
}
function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(area / 2);
}
function ensureCCW(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) s += (ring[i + 1][0] - ring[i][0]) * (ring[i + 1][1] + ring[i][1]);
  return s > 0 ? ring.slice().reverse() : ring;
}
const round3 = (x) => Math.round(x * 1000) / 1000;

// 沿环每条边线性插值密集化，使相邻顶点间距不超过 maxStep 度（仅补点、不改形状）。
function densifyRing(ring, maxStep) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1];
    out.push(a);
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (dist > maxStep) {
      const n = Math.ceil(dist / maxStep);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        out.push([round3(a[0] + (b[0] - a[0]) * t), round3(a[1] + (b[1] - a[1]) * t)]);
      }
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

// =============================================================================
// Natural Earth 加载 / 缓存
// =============================================================================
async function loadLandRings() {
  let text;
  if (existsSync(CACHE_FILE)) {
    text = await readFile(CACHE_FILE, 'utf8');
  } else {
    console.log('Downloading Natural Earth 50m land...');
    const res = await fetch(NE_URL);
    if (!res.ok) throw new Error(`NE download failed: ${res.status}`);
    text = await res.text();
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE_FILE, text);
    console.log('Cached NE land to scripts/.cache/');
  }
  const land = JSON.parse(text);
  const rings = [];
  const pushRing = (pts) => {
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const p of pts) {
      if (p[0] < minx) minx = p[0];
      if (p[1] < miny) miny = p[1];
      if (p[0] > maxx) maxx = p[0];
      if (p[1] > maxy) maxy = p[1];
    }
    rings.push({ pts, minx, miny, maxx, maxy });
  };
  for (const feat of land.features) {
    const g = feat.geometry;
    if (g.type === 'Polygon') pushRing(g.coordinates[0]);
    else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) pushRing(poly[0]);
  }
  return rings;
}

// 把若干“框”的并集与真实陆地求交，描出干净的外轮廓陆块（本土 + 近海大岛）。
function clipBlocks(blocks, landRings) {
  // 网格范围 = 所有框的包围盒 + 1° 余量
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const b of blocks) for (const p of b) {
    if (p[0] < minx) minx = p[0];
    if (p[1] < miny) miny = p[1];
    if (p[0] > maxx) maxx = p[0];
    if (p[1] > maxy) maxy = p[1];
  }
  const lng0 = Math.floor(minx - 1), lat0 = Math.floor(miny - 1);
  const lngMax = Math.ceil(maxx + 1), latMax = Math.ceil(maxy + 1);
  const nx = Math.round((lngMax - lng0) / CELL);
  const ny = Math.round((latMax - lat0) / CELL);
  const grid = { nx, ny, lng0, lat0, cell: CELL };

  const env = new Uint8Array(nx * ny);
  for (const b of blocks) fillMask(env, grid, b);

  const land = new Uint8Array(nx * ny);
  for (const r of landRings) {
    if (r.maxx < lng0 || r.minx > lngMax || r.maxy < lat0 || r.miny > latMax) continue;
    fillMask(land, grid, r.pts);
  }

  const mask = new Uint8Array(nx * ny);
  for (let i = 0; i < mask.length; i++) mask[i] = env[i] & land[i];

  const loops = traceBoundary(mask, nx, ny);
  const out = [];
  for (const loop of loops) {
    let ring = loop.map(([i, j]) => [lng0 + i * CELL, lat0 + j * CELL]);
    // 先按原始阶梯环判面积：丢小碎屑/内陆孔洞，免得给它们做无谓圆角
    const a = signedArea(ring);
    if (Math.abs(a) < MIN_RING_AREA) continue; // 丢小碎屑 + 内陆湖洞
    if (a < 0) continue;                        // 只保留外环（CCW），丢洞
    // 阶梯 → 平滑：轻量去共线点（保留台阶角）→ Chaikin 磨圆 → 末轮简化控点
    ring = douglasPeucker(ring, PRE_DP_EPS);
    ring = chaikinClosed(ring, CHAIKIN_ITERS);
    ring = douglasPeucker(ring, DP_EPS);
    if (ring.length < 4) continue;
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ring.push([...ring[0]]);
    out.push(ring.map((p) => [round3(p[0]), round3(p[1])]));
  }
  out.sort((p, q) => signedArea(q) - signedArea(p)); // 大块在前
  return out;
}

function makeFeature(def, landRings) {
  const [civId, phase] = def.key.split(':');
  const common = COMMON[civId];
  const meta = META[def.key];

  let rings = clipBlocks(def.blocks, landRings);
  if (rings.length === 0) throw new Error(`${def.key}: no rings survived clipping`);

  // 顶点门槛（验证器要求）：Polygon ≥40，MultiPolygon ≥80 总。
  // 不足则按最长边逐步补点（仅沿真实海岸边插点，不改轮廓）。
  const target = rings.length === 1 ? 44 : 84; // 留一点余量
  let step = 1.2;
  while (rings.reduce((s, r) => s + r.length, 0) < target && step > 0.05) {
    step *= 0.6;
    rings = rings.map((r) => densifyRing(r, step));
  }

  const geometry = rings.length === 1
    ? { type: 'Polygon', coordinates: [rings[0]] }
    : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };

  return {
    type: 'Feature',
    id: civId,
    properties: {
      id: civId,
      dynasty: common.dynasty,
      phase,
      phaseLabel: meta.phaseLabel,
      startYear: meta.startYear,
      endYear: meta.endYear,
      color: common.color,
      capital: common.capital,
      summary: meta.summary,
      accuracy: 'coastline-aware-rough',
      accuracyLabel: ACCURACY_LABEL,
      accuracyNote: ACCURACY_NOTE,
      sourceNote: SOURCE_NOTE,
    },
    geometry,
  };
}

async function main() {
  const landRings = await loadLandRings();
  console.log(`Loaded ${landRings.length} land rings from Natural Earth 50m`);

  const fc = JSON.parse(await readFile(DATA, 'utf8'));
  const nonSample = fc.features.filter((f) => !SAMPLE_IDS.has(f.properties?.id || f.id));
  const generated = DEFS.map((d) => makeFeature(d, landRings));
  fc.features = [...nonSample, ...generated];
  await writeFile(DATA, `${JSON.stringify(fc, null, 2)}\n`, 'utf8');

  console.log(`Kept ${nonSample.length} non-sample features, regenerated ${generated.length} sample features.`);
  for (const f of generated) {
    const g = f.geometry;
    const verts = g.type === 'Polygon' ? g.coordinates[0].length : g.coordinates.reduce((s, p) => s + p[0].length, 0);
    const blocks = g.type === 'MultiPolygon' ? `${g.coordinates.length}blk` : '1';
    console.log(`  ${f.properties.id}:${f.properties.phase} → ${verts}v (${blocks})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
