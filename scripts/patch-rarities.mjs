// scripts/patch-rarities.mjs
import fs from 'fs/promises';
import path from 'path';

const PACKS_DIR = './src/data/packs-cn';
const DB_FILE = './src/data/cards-db.json';

const db = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));
const files = (await fs.readdir(PACKS_DIR)).filter(f => f.endsWith('.json'));

// 初始化每张卡的 rarities
for (const id of Object.keys(db)) db[id].rarities = [];

for (const file of files) {
  const data = JSON.parse(await fs.readFile(path.join(PACKS_DIR, file), 'utf-8'));
  if (!data.pool) continue;

  for (const [rarity, ids] of Object.entries(data.pool)) {
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const card = db[String(id)];
      if (card && !card.rarities.includes(rarity)) {
        card.rarities.push(rarity);
      }
    }
  }
}

await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
console.log('完成，已为所有卡片补充 rarities 字段');