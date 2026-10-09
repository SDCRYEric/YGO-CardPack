// scripts/fetch-all-packs.mjs
import fs from 'fs/promises';
import path from 'path';

const SETS_FILE = './src/data/sets-list.json';
const OUT_DIR = './src/data/packs';
const DELAY_MS = 300; // 每次请求间隔，300ms 足够安全

const setsRaw = await fs.readFile(SETS_FILE, 'utf-8');
const setsData = JSON.parse(setsRaw);

await fs.mkdir(OUT_DIR, { recursive: true });

// 已存在的文件（断点续传：跳过已抓取的）
const existingFiles = await fs.readdir(OUT_DIR);
const existingCodes = new Set(
  existingFiles
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
);

// 按 code 去重（同一个 code 只抓一次）
const seenCodes = new Set();
const uniqueSets = [];
for (const set of setsData) {
  if (seenCodes.has(set.code)) continue;
  seenCodes.add(set.code);
  uniqueSets.push(set);
}

console.log(`总计 ${uniqueSets.length} 个唯一卡包，已存在 ${existingCodes.size} 个数据文件\n`);

let success = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < uniqueSets.length; i++) {
  const set = uniqueSets[i];
  const code = set.code;
  const fileName = `${code}.json`;

  if (existingCodes.has(code)) {
    skipped++;
    continue;
  }

  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.name)}`;
  process.stdout.write(`[${i + 1}/${uniqueSets.length}] ${code} - ${set.name} ... `);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      failed++;
      await new Promise(r => setTimeout(r, DELAY_MS));
      continue;
    }

    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      console.log('API 无数据');
      // 写入空文件，避免重复抓取
      await fs.writeFile(
        path.join(OUT_DIR, fileName),
        JSON.stringify({ setName: set.name, pool: {}, empty: true }, null, 2)
      );
      failed++;
      await new Promise(r => setTimeout(r, DELAY_MS));
      continue;
    }

    const pool = {};
    for (const card of json.data) {
      const setInfo = card.card_sets?.find(s => s.set_name === set.name);
      if (!setInfo) continue;
      const rarity = setInfo.set_rarity;
      if (!pool[rarity]) pool[rarity] = [];
      pool[rarity].push({
        id: card.id,
        name: card.name,
        type: card.type,
        desc: card.desc,
        image: card.card_images[0].image_url_small,
        rarity,
      });
    }

    const totalCards = Object.values(pool).flat().length;
    if (totalCards === 0) {
      console.log('解析后 0 张卡');
      await fs.writeFile(
        path.join(OUT_DIR, fileName),
        JSON.stringify({ setName: set.name, pool: {}, empty: true }, null, 2)
      );
      failed++;
      await new Promise(r => setTimeout(r, DELAY_MS));
      continue;
    }

    await fs.writeFile(
      path.join(OUT_DIR, fileName),
      JSON.stringify({ setName: set.name, pool }, null, 2)
    );

    console.log(`✓ ${totalCards} 张`);
    success++;
  } catch (err) {
    console.log(`错误: ${err.message}`);
    failed++;
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

console.log(`\n===== 全部完成 =====`);
console.log(`成功: ${success}`);
console.log(`跳过（已存在）: ${skipped}`);
console.log(`无数据/失败: ${failed}`);
console.log(`\n数据文件位于: ${OUT_DIR}`);