/* ============================================================
 * 朝代边界几何平滑（运行时，不改数据 JSON）
 *
 * 简化版边界多为低顶点凸壳/折线，放大后尖角折线显得"廉价不圆滑"。
 * 这里用 Chaikin 角点切割（corner-cutting）在内存里把每个面要素的环
 * 打磨圆润：每次迭代用 1/4、3/4 两个内插点替换原顶点，折角自然收圆。
 *
 * 约束：
 *  - 纯几何变换，输入的 FeatureCollection 不被改写（返回新对象）；
 *  - 完整保留 feature.properties（accuracy/color/起止年等），交互/筛选不受影响；
 *  - 用 WeakMap 按输入对象缓存结果，避免每次 setData 重复计算。
 * ============================================================ */

const cache = new WeakMap();

// 对单个闭合环做 Chaikin。ring: [[lng,lat], ...]（首尾可重合）。
function chaikinRing(ring, iterations) {
  let pts = ring.slice();
  // 去掉闭合重复点，纯按多边形顶点环处理，最后再闭合
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
  }
  // 顶点太少（三角形以下），平滑会塌缩成一点，原样返回（保持闭合）。
  if (pts.length < 4) return ring.slice();

  for (let it = 0; it < iterations; it += 1) {
    const n = pts.length;
    const next = new Array(n * 2);
    for (let i = 0; i < n; i += 1) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      next[i * 2] = [p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25];
      next[i * 2 + 1] = [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75];
    }
    pts = next;
  }
  pts.push(pts[0].slice()); // 闭合环
  return pts;
}

// 顶点越多说明本就细致（如海岸贴合样本），少迭代即可；稀疏凸壳多迭代收圆。
// 多数朝代是低顶点凸壳（生硬折角+长直边），稀疏档多加一轮迭代把折角收得更圆润自然。
function iterationsForRing(ring) {
  const n = ring.length;
  if (n <= 12) return 4;
  if (n <= 40) return 3;
  if (n <= 90) return 2;
  if (n <= 200) return 1;
  return 0; // 已足够细致，不再加点
}

function smoothPolygon(coords) {
  // coords: [outerRing, hole1, ...]
  return coords.map((ring) => chaikinRing(ring, iterationsForRing(ring)));
}

function smoothGeometry(geometry) {
  if (!geometry) return geometry;
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: smoothPolygon(geometry.coordinates) };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) => smoothPolygon(poly)),
    };
  }
  return geometry; // 其他类型（点/线）原样
}

/** 返回一个所有面要素被 Chaikin 平滑过的新 FeatureCollection（带缓存）。 */
export function smoothBoundaryCollection(collection) {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    return collection;
  }
  const cached = cache.get(collection);
  if (cached) return cached;
  const result = {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      geometry: smoothGeometry(feature.geometry),
    })),
  };
  cache.set(collection, result);
  return result;
}
