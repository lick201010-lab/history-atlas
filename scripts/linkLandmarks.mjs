// One-shot link of dynasties → landmarks. Idempotent: re-running produces the same set.
// Only adds well-attested associations; preserves existing entries (e.g. tang→changan).
// Run with: node scripts/linkLandmarks.mjs

import { readFile, writeFile } from 'node:fs/promises';

const DYNASTY_PATH = new URL('../src/data/dynasties.json', import.meta.url);
const LANDMARK_PATH = new URL('../src/data/landmarks.json', import.meta.url);

const LINKS = {
  // 中国
  qin: ['terracotta-army', 'great-wall'],
  han: ['changan', 'great-wall'],
  sui: ['changan'],
  tang: ['changan'], // sample, kept
  ming: ['forbidden-city', 'temple-of-heaven', 'great-wall'],
  qing: ['forbidden-city', 'temple-of-heaven', 'great-wall'],
  yuan: ['forbidden-city', 'great-wall'],

  // 埃及
  'egypt-old-kingdom': ['pyramid'],
  'egypt-new-kingdom': ['pyramid'],

  // 两河 / 波斯
  babylon: ['ishtar-gate', 'ziggurat-ur'],
  achaemenid: ['persepolis'],

  // 地中海
  'greek-city-states': ['parthenon'],
  'roman-republic-empire': ['colosseum'], // sample, kept
  byzantine: ['colosseum', 'parthenon', 'hagia-sophia'],
  ottoman: ['hagia-sophia'],

  // 中东 / 伊斯兰
  'islamic-caliphates': ['mecca-haram', 'petra'], // sample — adding without removing nothing

  // 南亚
  maurya: ['sanchi-stupa'],
  mughal: ['tajmahal', 'red-fort'], // sample — keep tajmahal, add red-fort

  // 东南亚
  khmer: ['angkor-wat'],
  srivijaya: ['borobudur'],

  // 朝鲜
  joseon: ['cheomseongdae'],

  // 美洲
  maya: ['chichen-itza'], // sample — was [], adding canonical Maya site
  inca: ['machu-picchu'],

  // 非洲（西非）
  mali: ['djenne-mosque'],
  songhai: ['djenne-mosque'],

  // 欧洲
  'british-empire': ['westminster-abbey'],

  // 现代
  prc: ['forbidden-city', 'great-wall', 'temple-of-heaven'],
};

const landmarks = JSON.parse(await readFile(LANDMARK_PATH, 'utf8'));
const landmarkIds = new Set(landmarks.map((l) => l.id));
const dynasties = JSON.parse(await readFile(DYNASTY_PATH, 'utf8'));

// Verify every linked id exists.
for (const [dynastyId, ids] of Object.entries(LINKS)) {
  for (const id of ids) {
    if (!landmarkIds.has(id)) {
      console.error(`Unknown landmark "${id}" linked to dynasty "${dynastyId}"`);
      process.exit(1);
    }
  }
}

let touched = 0;
for (const dynasty of dynasties) {
  const link = LINKS[dynasty.id];
  if (!link) continue;
  const existing = Array.isArray(dynasty.relatedLandmarks) ? dynasty.relatedLandmarks : [];
  // Union of existing + link, preserving order: existing first, then new ones.
  const next = [...existing];
  for (const id of link) if (!next.includes(id)) next.push(id);
  // Cap at 6 to keep the card tidy.
  dynasty.relatedLandmarks = next.slice(0, 6);
  touched += 1;
}

await writeFile(DYNASTY_PATH, JSON.stringify(dynasties, null, 2) + '\n', 'utf8');
console.log(`Linked ${touched} dynasties to landmarks.`);
