// scripts/diagnose-cn.mjs
import fs from 'fs/promises';

const DB_FILE = './src/data/cards-db.json';
const cardsDb = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));

const CN_RE = /[\u4e00-\u9fa5]/;

let total = 0, cnName = 0, enNameOnly = 0;
let cnImage = 0, enImage = 0;

const samples = [];

for (const [id, card] of Object.entries(cardsDb)) {
  total++;
  if (CN_RE.test(card.name || '')) cnName++;
  else {
    enNameOnly++;
    if (samples.length < 5) samples.push({ id, name: card.name });
  }
  if ((card.image || '').includes('momobako')) cnImage++;
  else enImage++;
}

console.log(`总计: ${total}`);
console.log(`中文名: ${cnName}  |  英文名: ${enNameOnly}`);
console.log(`中文图: ${cnImage}  |  英文图: ${enImage}`);
if (samples.length > 0) {
  console.log('\n英文名样例：');
  for (const s of samples) console.log(`  ${s.id}  ${s.name}`);
}