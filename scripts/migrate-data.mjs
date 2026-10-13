// scripts/migrate-data.mjs
import fs from 'fs/promises';
import path from 'path';

const PACKS_DIR = './src/data/packs-cn';
const DB_FILE = './src/data/cards-db.json';

const files = (await fs.readdir(PACKS_DIR)).filter(f => f.endsWith('.json'));
console.log(`发现 ${files.length} 个卡包文件\n`);

// 断点续传：如果已有部分卡片库，先加载
let cardsDb = {};
try {
  const existing = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));
  cardsDb = existing;
  console.log(`已加载现有卡片库: ${Object.keys(cardsDb).length} 张\n`);
} catch {
  console.log('从头开始创建卡片库\n');
}

let processed = 0, skipped = 0, cardsAdded = 0;

for (const file of files) {
  const filePath = path.join(PACKS_DIR, file);

  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    if (!data.pool) continue;

    // 检查是否已迁移（pool 的值是数字数组）
    const firstVal = Object.values(data.pool)[0];
    if (Array.isArray(firstVal) && typeof firstVal[0] === 'number') {
      skipped++;
      continue;
    }

    const newPool = {};

    for (const [rarity, cardList] of Object.entries(data.pool)) {
      if (!Array.isArray(cardList)) continue;
      newPool[rarity] = [];

      for (const card of cardList) {
        if (!card || typeof card !== 'object' || !card.id) continue;

        // 写入卡片库（如果还没有）
        if (!cardsDb[card.id]) {
          cardsDb[card.id] = {
            id: card.id,
            name: card.name,
            nameEn: card.nameEn || card.name,
            desc: card.desc || '',
            descEn: card.descEn || '',
            image: card.image,
            type: card.type || '',
          };
          cardsAdded++;
        }

        newPool[rarity].push(card.id);
      }
    }

    await fs.writeFile(
      filePath,
      JSON.stringify({ setName: data.setName, pool: newPool }, null, 2)
    );

    processed++;
    if (processed % 50 === 0) {
      console.log(`已处理 ${processed} 个卡包...`);
    }
  } catch (err) {
    console.log(`✗ ${file}: ${err.message}`);
  }
}

await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));

console.log(`\n===== 完成 =====`);
console.log(`处理卡包: ${processed}`);
console.log(`跳过（已迁移）: ${skipped}`);
console.log(`新增卡片: ${cardsAdded}`);
console.log(`卡片库总数: ${Object.keys(cardsDb).length}`);
console.log(`卡片库文件: ${DB_FILE}`);