// scripts/patch-card-details.mjs
import fs from 'fs/promises';

const DB_FILE = './src/data/cards-db.json';
const BATCH_SIZE = 50;
const DELAY_MS = 400;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

console.log('读取现有卡片库...');
const cardsDb = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));
const ids = Object.keys(cardsDb).map(Number);
console.log(`共 ${ids.length} 张卡\n`);

// 分批
const batches = [];
for (let i = 0; i < ids.length; i += BATCH_SIZE) {
  batches.push(ids.slice(i, i + BATCH_SIZE));
}

console.log(`将分 ${batches.length} 批请求\n`);

let updated = 0;
let failedBatches = 0;

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${batch.join(',')}`;

  process.stdout.write(`[${i + 1}/${batches.length}] `);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      failedBatches++;
      await sleep(DELAY_MS * 2);
      continue;
    }
    const json = await res.json();
    if (!json.data) {
      console.log('无数据');
      failedBatches++;
      await sleep(DELAY_MS);
      continue;
    }

    for (const card of json.data) {
      const target = cardsDb[String(card.id)];
      if (!target) continue;

      target.race = card.race || '';
      target.attribute = card.attribute || '';
      target.typeEn = card.type || '';
      if (card.atk !== undefined) target.atk = card.atk;
      if (card.def !== undefined) target.def = card.def;
      if (card.level !== undefined) target.level = card.level;
      if (card.linkval !== undefined) target.linkval = card.linkval;
      if (card.archetype) target.archetype = card.archetype;

      updated++;
    }

    console.log(`✓ ${json.data.length} 张`);
  } catch (err) {
    console.log(`错误: ${err.message}`);
    failedBatches++;
  }

  await sleep(DELAY_MS);
}

await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));

console.log(`\n===== 完成 =====`);
console.log(`已更新: ${updated} 张`);
console.log(`失败批次: ${failedBatches}`);