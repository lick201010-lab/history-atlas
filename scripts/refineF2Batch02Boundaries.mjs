import { readFile, writeFile } from 'node:fs/promises';

const DATA_URL = new URL('../src/data/boundaries-simplified.json', import.meta.url);

const ACCURACY_NOTE = '边界为 rough-refined 历史沙盘示意范围，参考地理轮廓、河谷、海岸与公开历史地图概化绘制；并非学术级精确疆域。';
const COAST_ACCURACY_NOTE = '边界为 coastline-aware rough-refined 历史沙盘示意范围，沿主要海岸、岛屿与河谷作视觉贴合；内陆边缘为历史势力包络，并非学术级精确疆域。';

function closeRing(points) {
  const ring = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    ring.push([current[0], current[1]]);
    if (index < points.length - 1) {
      ring.push([
        Number(((current[0] + next[0]) / 2).toFixed(3)),
        Number(((current[1] + next[1]) / 2).toFixed(3)),
      ]);
    }
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return ring;
}

function polygon(points) {
  return {
    type: 'Polygon',
    coordinates: [closeRing(points)],
  };
}

function multiPolygon(rings) {
  return {
    type: 'MultiPolygon',
    coordinates: rings.map((ring) => [closeRing(ring)]),
  };
}

function feature({
  id,
  dynasty,
  phase,
  phaseLabel,
  startYear,
  endYear,
  color,
  capital,
  summary,
  accuracy = 'rough-refined',
  accuracyLabel = '粗略精修多边形',
  accuracyNote = ACCURACY_NOTE,
  sourceNote,
  geometry,
}) {
  return {
    type: 'Feature',
    properties: {
      id,
      dynasty,
      phase,
      phaseLabel,
      startYear,
      endYear,
      color,
      capital,
      summary,
      accuracy,
      accuracyLabel,
      accuracyNote,
      sourceNote,
    },
    geometry,
  };
}

const source = {
  greek: '希腊城邦为文化圈而非统一国家。本图参考公开古典希腊、殖民地与爱琴海历史地图，按城邦本土、爱奥尼亚、岛屿和西地中海殖民地作分块示意。',
  assyrian: '参考中亚述与新亚述时期公开历史地图，以底格里斯上游、两河、黎凡特、埃及远征区和扎格罗斯边缘作粗略历史包络。',
  babylon: '巴比伦在当前数据中作为单一文明记录，实际包含古巴比伦、加喜特/后巴比伦和新巴比伦等断续政权。本图按沙盘展示需要作连续阶段化概化。',
  egyptOld: '参考古王国时期尼罗河谷、三角洲、孟菲斯核心区、第一瀑布和西奈影响范围的公开历史地图，按河谷文明范围作示意。',
  carolingian: '参考查理曼帝国、路易一世时期和凡尔登条约后公开历史地图，沿高卢、低地、日耳曼、北意大利与比利牛斯边缘作粗略包络。',
  hre: '参考奥托王朝、霍亨斯陶芬时代与晚期神圣罗马帝国公开历史地图，沿德意志、中欧、波希米亚、勃艮第与北意大利作粗略历史包络。',
};

const greekMainlandRise = [
  [19.3, 39.7], [20.0, 40.2], [21.2, 40.5], [22.5, 40.4], [23.6, 40.0],
  [24.6, 39.4], [25.2, 38.7], [24.7, 38.1], [24.0, 37.7], [23.5, 37.0],
  [23.0, 36.4], [22.1, 36.2], [21.4, 36.7], [20.7, 37.1], [20.2, 37.8],
  [19.6, 38.2], [19.1, 38.7], [19.0, 39.2],
];

const greekMainlandPeak = [
  [18.8, 40.0], [19.7, 40.7], [21.0, 41.1], [22.5, 41.0], [23.8, 40.6],
  [25.0, 40.0], [26.3, 39.4], [26.8, 38.6], [26.1, 37.8], [25.0, 37.3],
  [24.0, 36.8], [23.5, 36.1], [22.6, 35.9], [21.7, 36.3], [20.8, 36.8],
  [20.0, 37.4], [19.4, 38.2], [18.9, 39.0],
];

const greekMainlandDecline = [
  [19.2, 40.0], [20.4, 40.7], [21.8, 40.9], [23.0, 40.6], [24.1, 40.1],
  [25.0, 39.4], [25.4, 38.5], [24.7, 37.8], [23.8, 37.3], [23.3, 36.7],
  [22.4, 36.4], [21.5, 36.7], [20.7, 37.3], [20.0, 38.0], [19.4, 38.7],
  [19.0, 39.4],
];

const ioniaRise = [
  [26.0, 40.2], [26.7, 39.9], [27.4, 39.3], [27.8, 38.6], [27.6, 37.8],
  [27.1, 37.1], [26.4, 36.9], [25.8, 37.4], [25.6, 38.2], [25.7, 39.1],
];

const ioniaPeak = [
  [25.8, 40.7], [26.7, 40.5], [27.8, 39.9], [28.3, 39.1], [28.4, 38.1],
  [28.1, 37.1], [27.4, 36.5], [26.5, 36.3], [25.7, 36.8], [25.4, 37.8],
  [25.3, 38.8], [25.4, 39.8],
];

const ioniaDecline = [
  [26.0, 40.0], [26.9, 39.6], [27.6, 38.9], [27.7, 38.0], [27.3, 37.2],
  [26.6, 36.9], [25.9, 37.3], [25.7, 38.2], [25.8, 39.1],
];

const crete = [
  [23.4, 35.7], [24.2, 35.9], [25.2, 35.8], [26.2, 35.5], [26.4, 35.1],
  [25.6, 34.8], [24.5, 34.8], [23.5, 35.0], [23.0, 35.3],
];

const sicilyGreek = [
  [12.3, 38.3], [13.3, 38.5], [14.5, 38.2], [15.4, 37.6], [15.1, 36.9],
  [14.0, 36.6], [12.8, 36.8], [12.1, 37.4],
];

const southItalyGreek = [
  [14.3, 40.6], [15.2, 40.3], [16.1, 39.7], [17.0, 39.0], [17.5, 38.4],
  [17.1, 37.9], [16.1, 38.2], [15.3, 38.9], [14.5, 39.7],
];

const blackSeaColonies = [
  [29.0, 45.8], [30.4, 46.3], [32.0, 46.4], [34.0, 46.0], [35.6, 45.3],
  [36.4, 44.5], [35.5, 43.9], [33.5, 44.2], [31.7, 44.6], [30.2, 45.0],
];

const aegeanIslandsA = [
  [24.1, 38.8], [24.8, 38.7], [25.3, 38.3], [25.2, 37.7], [24.6, 37.4],
  [23.9, 37.6], [23.7, 38.2],
];

const aegeanIslandsB = [
  [25.0, 37.0], [25.8, 37.0], [26.3, 36.5], [26.0, 35.9], [25.1, 35.8],
  [24.6, 36.3],
];

const carolingianRiseCore = [
  [-5.0, 43.2], [-3.5, 43.0], [-1.4, 43.2], [0.8, 43.8], [2.8, 44.7],
  [4.4, 45.8], [5.2, 47.0], [4.9, 48.4], [3.7, 49.8], [2.0, 50.8],
  [0.2, 50.6], [-1.6, 49.8], [-3.2, 48.7], [-4.4, 47.4], [-4.9, 45.8],
  [-5.2, 44.4],
];

const carolingianRiseEast = [
  [4.2, 48.0], [5.2, 49.6], [6.8, 51.2], [8.8, 52.4], [11.2, 52.8],
  [13.2, 52.0], [14.3, 50.6], [14.0, 49.0], [12.8, 47.8], [11.0, 46.9],
  [8.8, 46.4], [6.8, 46.5], [5.3, 47.0],
];

const carolingianRiseItaly = [
  [7.6, 44.4], [7.8, 44.8], [8.6, 45.3], [9.8, 45.8], [11.1, 45.9],
  [12.4, 45.5], [13.4, 44.7], [14.0, 43.7], [13.7, 42.9], [12.8, 42.2],
  [11.6, 42.2], [10.4, 42.8], [9.2, 43.5], [8.2, 44.2],
];

const carolingianPeakCore = [
  [-5.7, 43.0], [-4.0, 42.8], [-1.6, 43.0], [0.8, 43.6], [3.0, 44.6],
  [4.9, 45.9], [5.8, 47.4], [5.4, 49.0], [4.0, 50.4], [2.2, 51.4],
  [0.2, 51.2], [-1.8, 50.3], [-3.7, 49.0], [-5.0, 47.6], [-5.4, 45.8],
  [-5.8, 44.3],
];

const carolingianPeakEast = [
  [4.8, 47.6], [5.8, 49.5], [7.5, 51.4], [9.8, 53.0], [12.4, 53.4],
  [15.0, 52.2], [16.4, 50.6], [16.0, 49.0], [14.6, 47.8], [12.4, 46.9],
  [9.8, 46.4], [7.4, 46.5], [5.8, 47.0],
];

const carolingianPeakItaly = [
  [6.9, 44.8], [7.5, 45.3], [8.8, 45.8], [10.4, 46.1], [12.0, 46.0],
  [13.5, 45.4], [14.9, 44.5], [15.7, 43.4], [15.4, 42.4], [14.2, 41.6],
  [12.8, 41.7], [11.3, 42.2], [9.8, 43.0], [8.3, 43.8], [7.2, 44.4],
];

const carolingianDeclineWest = [
  [-5.1, 43.3], [-3.0, 43.0], [-0.8, 43.3], [1.5, 44.1], [3.5, 45.2],
  [4.6, 46.6], [4.2, 48.2], [2.8, 49.4], [1.0, 50.0], [-1.0, 49.4],
  [-2.8, 48.6], [-4.0, 48.0], [-4.4, 47.4], [-4.8, 45.8], [-5.0, 44.8],
  [-5.2, 44.4],
];

const carolingianDeclineEast = [
  [5.4, 47.2], [6.8, 48.2], [7.8, 49.6], [9.2, 50.8], [11.0, 51.6],
  [12.7, 51.4], [13.8, 50.4], [13.5, 49.0], [12.4, 47.8], [10.8, 46.8],
  [8.8, 46.5], [7.0, 46.6], [5.8, 46.9],
];

const carolingianDeclineItaly = [
  [7.8, 44.6], [8.8, 45.2], [10.1, 45.6], [11.4, 45.5], [12.6, 44.9],
  [13.2, 44.0], [13.0, 43.1], [12.0, 42.4], [10.8, 42.5], [9.6, 43.0],
  [8.5, 43.7],
];

const hreRiseCore = [
  [4.8, 46.3], [5.2, 47.1], [5.9, 48.3], [6.8, 49.6], [8.2, 51.0],
  [10.0, 52.0], [11.8, 52.8], [13.0, 52.7], [14.4, 52.1], [15.7, 51.0],
  [16.6, 49.6], [16.4, 48.3], [15.2, 47.3], [13.7, 46.7], [12.0, 46.5],
  [10.2, 46.7], [8.4, 46.9], [6.7, 46.8], [5.4, 46.3], [4.9, 45.8],
  [4.6, 46.0],
];

const hreRiseBurgundy = [
  [4.0, 44.7], [4.4, 45.6], [5.1, 46.4], [5.9, 47.0], [7.0, 47.2],
  [7.7, 46.3], [7.2, 45.3], [6.2, 44.3], [5.0, 43.8], [4.2, 44.1],
];

const hreRiseItaly = [
  [7.6, 44.4], [8.0, 44.8], [8.9, 45.5], [10.2, 45.9], [11.6, 45.8],
  [12.7, 45.2], [13.4, 44.4], [13.5, 43.6], [12.6, 42.9], [11.4, 43.0],
  [10.2, 43.5], [9.0, 44.1],
];

const hrePeakCore = [
  [3.9, 46.4], [4.5, 47.6], [5.4, 49.0], [6.8, 50.6], [8.7, 52.1],
  [11.0, 53.2], [13.0, 53.5], [15.0, 52.9], [16.8, 51.6], [18.0, 49.8],
  [18.0, 48.4], [16.9, 47.2], [15.0, 46.6], [13.0, 46.5], [10.8, 46.8],
  [8.8, 47.0], [7.0, 47.0], [5.5, 46.6], [4.4, 45.8], [3.7, 45.5],
];

const hrePeakBurgundy = [
  [3.6, 44.6], [4.2, 45.8], [5.2, 46.8], [6.5, 47.4], [7.7, 47.1],
  [8.2, 46.1], [7.5, 45.0], [6.2, 43.9], [4.8, 43.5], [3.8, 43.9],
];

const hrePeakItaly = [
  [7.0, 44.5], [7.8, 45.4], [9.2, 45.9], [10.9, 46.1], [12.5, 45.9],
  [14.0, 45.2], [15.3, 44.1], [16.0, 42.9], [15.4, 41.9], [14.2, 41.4],
  [12.8, 41.6], [11.4, 42.0], [9.8, 42.8], [8.4, 43.7], [7.3, 44.2],
];

const hreDeclineCore = [
  [5.4, 46.8], [5.9, 48.1], [6.8, 49.5], [8.2, 50.8], [10.0, 51.8],
  [12.0, 52.2], [14.0, 51.8], [15.7, 50.8], [16.8, 49.5], [17.2, 48.4],
  [16.6, 47.3], [15.2, 46.5], [13.3, 46.0], [11.4, 46.1], [9.6, 46.7],
  [8.0, 47.1], [6.8, 47.0], [5.8, 46.6], [5.3, 46.3], [5.1, 46.6],
];

const features = [
  feature({
    id: 'greek-city-states',
    dynasty: '希腊诸城邦',
    phase: 'rise',
    phaseLabel: '城邦形成与早期殖民',
    startYear: -800,
    endYear: -508,
    color: '#ecf0f1',
    capital: '雅典',
    summary: '希腊城邦在本土、爱琴海与小亚爱奥尼亚沿岸形成，西地中海殖民点开始出现。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.greek,
    geometry: multiPolygon([
      greekMainlandRise, ioniaRise, crete, aegeanIslandsA, aegeanIslandsB, southItalyGreek, sicilyGreek,
    ]),
  }),
  feature({
    id: 'greek-city-states',
    dynasty: '希腊诸城邦',
    phase: 'peak',
    phaseLabel: '古典希腊与殖民网络',
    startYear: -507,
    endYear: -431,
    color: '#ecf0f1',
    capital: '雅典',
    summary: '雅典、斯巴达、科林斯等城邦进入古典高峰，爱琴海、小亚沿岸、南意大利、西西里与黑海殖民网络共同构成希腊世界。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.greek,
    geometry: multiPolygon([
      greekMainlandPeak, ioniaPeak, crete, aegeanIslandsA, aegeanIslandsB, southItalyGreek, sicilyGreek, blackSeaColonies,
    ]),
  }),
  feature({
    id: 'greek-city-states',
    dynasty: '希腊诸城邦',
    phase: 'decline',
    phaseLabel: '伯罗奔尼撒战争后至马其顿崛起',
    startYear: -430,
    endYear: -338,
    color: '#ecf0f1',
    capital: '雅典',
    summary: '长期城邦战争削弱希腊本土，马其顿势力南下，爱琴海和爱奥尼亚仍保留希腊城市文化圈。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.greek,
    geometry: multiPolygon([
      greekMainlandDecline, ioniaDecline, crete, aegeanIslandsA, aegeanIslandsB, southItalyGreek, sicilyGreek,
    ]),
  }),

  feature({
    id: 'assyrian',
    dynasty: '亚述帝国',
    phase: 'rise',
    phaseLabel: '中亚述本土扩张',
    startYear: -1365,
    endYear: -912,
    color: '#8e5b3a',
    capital: '尼尼微',
    summary: '中亚述以亚述、尼尼微和底格里斯上游为核心，控制两河上游与扎格罗斯西缘通道。',
    sourceNote: source.assyrian,
    geometry: polygon([
      [38.6, 36.7], [39.4, 37.3], [40.6, 37.8], [42.1, 38.0], [43.5, 37.8],
      [44.8, 37.3], [45.7, 36.5], [46.0, 35.5], [45.6, 34.6], [44.7, 33.9],
      [43.5, 33.5], [42.3, 33.7], [41.1, 34.2], [40.0, 34.8], [39.1, 35.5],
      [38.4, 36.1], [38.1, 36.5],
    ]),
  }),
  feature({
    id: 'assyrian',
    dynasty: '亚述帝国',
    phase: 'peak',
    phaseLabel: '新亚述帝国极盛',
    startYear: -911,
    endYear: -671,
    color: '#8e5b3a',
    capital: '尼尼微',
    summary: '新亚述控制两河、叙利亚、腓尼基、以色列和埃及北部，势力由尼罗河三角洲延伸至伊朗西部。',
    sourceNote: source.assyrian,
    geometry: polygon([
      [29.2, 30.7], [30.0, 31.5], [31.3, 31.8], [32.4, 31.4], [33.0, 30.4],
      [34.0, 29.6], [34.8, 30.6], [35.3, 31.7], [35.4, 33.0], [36.1, 34.0],
      [37.3, 35.0], [38.8, 36.2], [40.4, 37.2], [42.6, 37.8], [44.8, 37.6],
      [47.0, 36.7], [48.5, 35.4], [49.3, 33.7], [48.5, 32.0], [47.0, 30.8],
      [45.0, 30.0], [42.8, 30.4], [40.8, 31.2], [38.7, 31.6], [36.8, 31.4],
      [35.2, 30.7], [33.9, 29.7], [32.9, 28.4], [31.8, 27.3], [30.5, 27.2],
      [29.7, 28.1], [29.2, 29.4],
    ]),
  }),
  feature({
    id: 'assyrian',
    dynasty: '亚述帝国',
    phase: 'decline',
    phaseLabel: '帝国崩解前收缩',
    startYear: -670,
    endYear: -609,
    color: '#8e5b3a',
    capital: '尼尼微',
    summary: '失去埃及和叙利亚西部后，亚述退回两河上游、北叙利亚和扎格罗斯西缘，最终尼尼微陷落。',
    sourceNote: source.assyrian,
    geometry: polygon([
      [36.2, 35.3], [37.3, 36.1], [38.8, 36.9], [40.5, 37.5], [42.3, 37.8],
      [44.0, 37.4], [45.3, 36.6], [46.0, 35.5], [45.6, 34.2], [44.5, 33.2],
      [42.8, 32.8], [41.0, 33.1], [39.2, 33.8], [37.8, 34.4], [36.7, 34.8],
      [36.0, 35.0],
    ]),
  }),

  feature({
    id: 'babylon',
    dynasty: '巴比伦王国',
    phase: 'rise',
    phaseLabel: '古巴比伦与汉谟拉比',
    startYear: -1894,
    endYear: -1595,
    color: '#9b59b6',
    capital: '巴比伦',
    summary: '古巴比伦以两河下游为核心，在汉谟拉比时期整合苏美尔、阿卡德和中部幼发拉底区域。',
    sourceNote: source.babylon,
    geometry: polygon([
      [42.3, 34.5], [43.1, 35.0], [44.2, 35.1], [45.2, 34.7], [46.0, 33.8],
      [46.6, 32.7], [47.0, 31.4], [47.2, 30.2], [46.7, 29.4], [45.6, 29.1],
      [44.4, 29.5], [43.4, 30.3], [42.7, 31.2], [42.2, 32.2], [41.8, 33.2],
      [41.9, 34.0],
    ]),
  }),
  feature({
    id: 'babylon',
    dynasty: '巴比伦王国',
    phase: 'peak',
    phaseLabel: '巴比伦核心延续与复兴',
    startYear: -1594,
    endYear: -562,
    color: '#9b59b6',
    capital: '巴比伦',
    summary: '当前单一文明记录压缩了巴比伦的断续政权史，此阶段示意两河下游核心长期延续，并在新巴比伦早期重新扩张至叙利亚与黎凡特。',
    sourceNote: source.babylon,
    geometry: polygon([
      [34.6, 31.8], [35.2, 33.0], [36.1, 34.1], [37.6, 35.0], [39.4, 35.7],
      [41.4, 36.0], [43.5, 35.8], [45.5, 35.0], [47.2, 33.8], [48.2, 32.0],
      [48.2, 30.4], [47.4, 29.2], [45.9, 28.8], [44.0, 29.3], [42.2, 30.1],
      [40.0, 30.5], [37.8, 30.7], [36.0, 31.1],
    ]),
  }),
  feature({
    id: 'babylon',
    dynasty: '巴比伦王国',
    phase: 'decline',
    phaseLabel: '新巴比伦后期至波斯征服',
    startYear: -561,
    endYear: -539,
    color: '#9b59b6',
    capital: '巴比伦',
    summary: '尼布甲尼撒二世后新巴比伦维持两河与黎凡特控制，但内政与波斯压力加剧，最终被居鲁士攻陷。',
    sourceNote: source.babylon,
    geometry: polygon([
      [35.0, 32.0], [35.7, 33.1], [36.8, 34.0], [38.5, 34.6], [40.5, 35.0],
      [42.8, 35.0], [44.8, 34.4], [46.4, 33.2], [47.3, 31.7], [47.4, 30.3],
      [46.6, 29.4], [45.2, 29.3], [43.8, 29.9], [42.2, 30.6], [40.3, 30.9],
      [38.4, 31.0], [36.6, 31.3],
    ]),
  }),

  feature({
    id: 'egypt-old-kingdom',
    dynasty: '埃及古王国',
    phase: 'rise',
    phaseLabel: '第三王朝与孟菲斯核心',
    startYear: -2686,
    endYear: -2614,
    color: '#e8c98a',
    capital: '孟菲斯',
    summary: '古王国早期以孟菲斯和尼罗河下游为核心，整合三角洲与上埃及北段。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '河谷与海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.egyptOld,
    geometry: polygon([
      [29.4, 31.1], [30.0, 31.6], [30.9, 31.8], [31.8, 31.6], [32.4, 31.1],
      [32.5, 30.3], [32.0, 29.5], [31.7, 28.7], [31.4, 27.8], [31.2, 26.9],
      [31.1, 26.0], [31.4, 25.1], [32.0, 24.5], [32.5, 25.2], [32.4, 26.2],
      [32.1, 27.3], [32.3, 28.5], [32.6, 29.6], [32.9, 30.5], [32.6, 31.3],
      [31.6, 31.9], [30.4, 32.0], [29.5, 31.6],
    ]),
  }),
  feature({
    id: 'egypt-old-kingdom',
    dynasty: '埃及古王国',
    phase: 'peak',
    phaseLabel: '金字塔时代极盛',
    startYear: -2613,
    endYear: -2494,
    color: '#e8c98a',
    capital: '孟菲斯',
    summary: '第四王朝至第五王朝前期，孟菲斯政权控制尼罗河三角洲、河谷至第一瀑布，并影响西奈矿区。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '河谷与海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.egyptOld,
    geometry: polygon([
      [28.8, 31.2], [29.6, 31.8], [30.8, 32.0], [32.0, 31.9], [33.0, 31.4],
      [33.6, 30.6], [34.0, 29.8], [33.5, 29.0], [32.8, 28.3], [32.5, 27.2],
      [32.4, 26.0], [32.7, 24.8], [33.0, 23.8], [32.4, 22.8], [31.5, 22.4],
      [30.7, 23.1], [30.9, 24.4], [30.7, 25.7], [30.5, 27.0], [30.3, 28.2],
      [29.9, 29.2], [29.4, 30.0], [28.8, 30.6],
    ]),
  }),
  feature({
    id: 'egypt-old-kingdom',
    dynasty: '埃及古王国',
    phase: 'decline',
    phaseLabel: '第六王朝后期与第一中间期前',
    startYear: -2493,
    endYear: -2181,
    color: '#e8c98a',
    capital: '孟菲斯',
    summary: '中央权威衰弱后，古王国仍围绕尼罗河谷和三角洲活动，但地方州侯权力上升，边缘影响收缩。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '河谷与海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.egyptOld,
    geometry: polygon([
      [29.6, 31.0], [30.2, 31.5], [31.1, 31.7], [32.0, 31.4], [32.4, 30.7],
      [32.1, 29.8], [31.8, 28.7], [31.5, 27.5], [31.4, 26.3], [31.5, 25.2],
      [31.8, 24.1], [32.0, 23.2], [31.4, 22.7], [30.8, 23.4], [30.7, 24.5],
      [30.5, 25.8], [30.3, 27.0], [30.0, 28.2], [29.7, 29.3], [29.4, 30.3],
    ]),
  }),

  feature({
    id: 'carolingian',
    dynasty: '查理曼帝国',
    phase: 'rise',
    phaseLabel: '加冕与帝国统一',
    startYear: 800,
    endYear: 814,
    color: '#74b9ff',
    capital: '亚琛',
    summary: '查理曼加冕后，法兰克势力覆盖高卢、低地、萨克森、巴伐利亚与北意大利，形成西欧帝国核心。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.carolingian,
    geometry: multiPolygon([carolingianRiseCore, carolingianRiseEast, carolingianRiseItaly]),
  }),
  feature({
    id: 'carolingian',
    dynasty: '查理曼帝国',
    phase: 'peak',
    phaseLabel: '帝国极盛与路易一世',
    startYear: 815,
    endYear: 843,
    color: '#74b9ff',
    capital: '亚琛',
    summary: '查理曼遗产在路易一世时期维持统一，西欧大陆从比利牛斯到易北河、从低地到北意大利连成一体。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.carolingian,
    geometry: multiPolygon([carolingianPeakCore, carolingianPeakEast, carolingianPeakItaly]),
  }),
  feature({
    id: 'carolingian',
    dynasty: '查理曼帝国',
    phase: 'decline',
    phaseLabel: '凡尔登分裂后',
    startYear: 844,
    endYear: 888,
    color: '#74b9ff',
    capital: '亚琛',
    summary: '凡尔登条约后帝国分为西、中、东法兰克，政治统一瓦解，本图保留王朝遗产的西欧核心带。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.carolingian,
    geometry: multiPolygon([carolingianDeclineWest, carolingianDeclineEast, carolingianDeclineItaly]),
  }),

  feature({
    id: 'holy-roman-empire',
    dynasty: '神圣罗马帝国',
    phase: 'rise',
    phaseLabel: '奥托王朝立国',
    startYear: 962,
    endYear: 1075,
    color: '#dfe6e9',
    capital: '法兰克福/维也纳',
    summary: '奥托一世加冕后，帝国以德意志王国、洛林、波希米亚和北意大利为核心，形成中欧复合政治体。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.hre,
    geometry: multiPolygon([hreRiseCore, hreRiseBurgundy, hreRiseItaly]),
  }),
  feature({
    id: 'holy-roman-empire',
    dynasty: '神圣罗马帝国',
    phase: 'peak',
    phaseLabel: '霍亨斯陶芬鼎盛',
    startYear: 1076,
    endYear: 1250,
    color: '#dfe6e9',
    capital: '法兰克福/维也纳',
    summary: '霍亨斯陶芬时代，帝国连接德意志、勃艮第、波希米亚、奥地利和意大利王国，跨越阿尔卑斯南北。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.hre,
    geometry: multiPolygon([hrePeakCore, hrePeakBurgundy, hrePeakItaly]),
  }),
  feature({
    id: 'holy-roman-empire',
    dynasty: '神圣罗马帝国',
    phase: 'decline',
    phaseLabel: '晚期邦国林立',
    startYear: 1251,
    endYear: 1806,
    color: '#dfe6e9',
    capital: '法兰克福/维也纳',
    summary: '帝国逐渐失去北意大利和勃艮第实控，晚期以德意志、中欧诸邦和奥地利—波希米亚核心维系到 1806 年。',
    accuracy: 'coastline-aware-rough',
    accuracyLabel: '海岸贴合粗多边形',
    accuracyNote: COAST_ACCURACY_NOTE,
    sourceNote: source.hre,
    geometry: polygon(hreDeclineCore),
  }),
];

const batchIds = new Set([
  'greek-city-states',
  'assyrian',
  'babylon',
  'egypt-old-kingdom',
  'carolingian',
  'holy-roman-empire',
]);

const collection = JSON.parse(await readFile(DATA_URL, 'utf8'));
collection.features = [
  ...collection.features.filter((item) => !batchIds.has(item.properties?.id || item.id)),
  ...features,
];

await writeFile(DATA_URL, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

console.log('Replaced F2 batch 02 boundaries: 15 accepted features across 5 civilizations, plus 3 egypt-old-kingdom draft features.');
