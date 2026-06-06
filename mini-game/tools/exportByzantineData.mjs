// 拜占庭样板数据导出（只读现有网页数据，绝不修改 src/data/*）。
// 读取 dynasties / boundaries-simplified / landmarks → 抽取「公元 600 / 拜占庭 / 东地中海聚焦」子集，
//   把经纬度边界做 Chaikin 平滑（去 GIS 锯齿，得游戏势力范围般顺滑的轮廓），等距投影到沙盘平面 XZ，
//   写出 mini-game/assets/byzantine/data/byzantine.json；并把拜占庭相关奇观 GLB 拷进 assets/landmarks/。
//
// 运行：node mini-game/tools/exportByzantineData.mjs
// 说明：本脚本属于 mini-game 工程，不接入网页构建，不改动任何现有源数据。

import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');          // 历史网站/
const SRC = path.join(REPO, 'src', 'data');
const MODELS = path.join(REPO, 'public', 'models');
const OUT_DATA = path.join(__dirname, '..', 'assets', 'byzantine', 'data', 'byzantine.json');
const OUT_LANDMARKS = path.join(__dirname, '..', 'assets', 'landmarks');

// ---- 样板参数 ----
const YEAR = 600;
const CIV_ID = 'byzantine';
// 东地中海聚焦框（经/纬）：安纳托利亚 + 巴尔干 + 爱琴海 + 黎凡特 + 塞浦路斯
const FOCUS = { lngMin: 18, lngMax: 44, latMin: 31, latMax: 49 };
// 等距投影参考点（君士坦丁堡附近）；unit = 每经/纬度对应的沙盘单位
const PROJ = { lon0: 27, lat0: 40, unit: 1.0 };
const LANDMARKS = [
  { id: 'hagia-sophia', primary: true, glb: 'hagia-sophia.glb' },
  { id: 'parthenon', primary: false, glb: 'parthenon.glb' },
  { id: 'colosseum', primary: false, glb: 'colosseum.glb' },
];

const readJson = async (f) => JSON.parse(await readFile(f, 'utf8'));

function project(lng, lat) {
  const x = (lng - PROJ.lon0) * Math.cos((PROJ.lat0 * Math.PI) / 180) * PROJ.unit;
  const z = -(lat - PROJ.lat0) * PROJ.unit;   // 北 → -Z（俯视镜头朝 -Z 看为北朝上）
  return [Number(x.toFixed(4)), Number(z.toFixed(4))];
}

// 闭合环的 Chaikin 角点切割平滑
function chaikin(ring, iterations = 2) {
  let pts = ring;
  for (let it = 0; it < iterations; it += 1) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    pts = out;
  }
  return pts;
}

function ringInFocus(ring) {
  return ring.some(([lng, lat]) => lng >= FOCUS.lngMin && lng <= FOCUS.lngMax && lat >= FOCUS.latMin && lat <= FOCUS.latMax);
}

async function main() {
  const dynRaw = await readJson(path.join(SRC, 'dynasties.json'));
  const bndRaw = await readJson(path.join(SRC, 'boundaries-simplified.json'));
  const lmRaw = await readJson(path.join(SRC, 'landmarks.json'));
  const dynasties = dynRaw.dynasties || dynRaw;
  const features = bndRaw.features || bndRaw;
  const landmarks = lmRaw.landmarks || lmRaw;

  const civ = dynasties.find((d) => d.id === CIV_ID);
  if (!civ) throw new Error('Byzantine dynasty not found');

  // 选出年份 600 生效的边界 feature（按 phase 的 start/end 命中）
  const feat = features.find((f) => {
    const p = f.properties || {};
    return p.id === CIV_ID && YEAR >= p.startYear && YEAR <= p.endYear;
  });
  if (!feat) throw new Error('No Byzantine boundary feature active at year ' + YEAR);

  // MultiPolygon / Polygon → 取外环，聚焦框过滤，Chaikin 平滑，投影到 XZ
  const polys = feat.geometry.type === 'MultiPolygon' ? feat.geometry.coordinates : [feat.geometry.coordinates];
  const rings = [];
  for (const poly of polys) {
    const outer = poly[0];                       // 只取外环（样板不需要洞）
    if (!ringInFocus(outer)) continue;
    const smoothLngLat = chaikin(outer, 2);
    const ring = smoothLngLat.map(([lng, lat]) => project(lng, lat));
    if (ring.length >= 6) rings.push(ring);
  }
  rings.sort((a, b) => b.length - a.length);     // 大环在前

  // 奇观
  const outLandmarks = [];
  for (const cfg of LANDMARKS) {
    const lm = landmarks.find((x) => x.id === cfg.id);
    if (!lm) continue;
    const [x, z] = project(lm.lng, lm.lat);
    outLandmarks.push({
      id: lm.id, name: lm.name, primary: cfg.primary, glb: cfg.glb,
      lng: lm.lng, lat: lm.lat, x, z, startYear: lm.startYear,
    });
  }

  const out = {
    generatedBy: 'mini-game/tools/exportByzantineData.mjs',
    note: 'Read-only export from web project data; do not edit by hand. Re-run the script to regenerate.',
    meta: { civId: CIV_ID, year: YEAR, phase: feat.properties.phase, phaseLabel: feat.properties.phaseLabel, projection: PROJ, focus: FOCUS },
    civ: {
      id: civ.id, name: civ.name, startYear: civ.startYear, endYear: civ.endYear,
      color: civ.color || feat.properties.color || '#9b59b6',
      capital: feat.properties.capital, summary: feat.properties.summary,
    },
    boundary: { ringCount: rings.length, rings },
    landmarks: outLandmarks,
  };

  await mkdir(path.dirname(OUT_DATA), { recursive: true });
  await writeFile(OUT_DATA, JSON.stringify(out, null, 2), 'utf8');

  // 拷贝相关 GLB（不一次性拷全部 30 个，只拷拜占庭样板用到的）
  await mkdir(OUT_LANDMARKS, { recursive: true });
  const copied = [];
  for (const cfg of LANDMARKS) {
    const srcGlb = path.join(MODELS, cfg.glb);
    try {
      await access(srcGlb);
      await copyFile(srcGlb, path.join(OUT_LANDMARKS, cfg.glb));
      copied.push(cfg.glb);
    } catch { /* 缺模型时跳过，不报错 */ }
  }

  const totalVerts = rings.reduce((s, r) => s + r.length, 0);
  console.log(`Byzantine export OK → assets/byzantine/data/byzantine.json`);
  console.log(`  year ${YEAR} phase=${feat.properties.phase} | rings=${rings.length} verts=${totalVerts} | landmarks=${outLandmarks.length}`);
  console.log(`  copied GLB → assets/landmarks/: ${copied.join(', ') || '(none found)'}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
