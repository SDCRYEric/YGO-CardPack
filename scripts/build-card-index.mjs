// scripts/build-card-index.mjs
import fs from 'fs/promises';
import path from 'path';

const PACKS_DIR = './src/data/packs-cn';
const OUT_FILE = './src/data/card-sets-index.json';

const files = (await fs.readdir(PACKS_DIR)).filter(f => f.endsWith('.json'));
console.log(`扫描 ${files.length} 个卡包文件...`);

// cardId -> [{ code, name, rarity }]
const index = {};
let processed = 0;

for (const file of files) {
  const code = file.replace('.json', '');
  const filePath = path.join(PACKS_DIR, file);

  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    if (!data.pool) continue;

    const setName = data.setName || code;

    for (const [rarity, ids] of Object.entries(data.pool)) {
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        const key = String(id);
        if (!index[key]) index[key] = [];

        const exists = index[key].some(
          e => e.code === code && e.rarity === rarity
        );
        if (!exists) {
          index[key].push({ code, name: setName, rarity });
        }
      }
    }

    processed++;
    if (processed % 100 === 0) {
      process.stdout.write(`\r已处理 ${processed}/${files.length}`);
    }
  } catch (err) {
    console.warn(`\n跳过 ${file}: ${err.message}`);
  }
}

// 排序
for (const id of Object.keys(index)) {
  index[id].sort((a, b) => a.code.localeCompare(b.code));
}

await fs.writeFile(OUT_FILE, JSON.stringify(index, null, 2));

const totalCards = Object.keys(index).length;
const totalEntries = Object.values(index).reduce((s, a) => s + a.length, 0);
const fileSizeMB = (
  (await fs.stat(OUT_FILE)).size /
  1024 /
  1024
).toFixed(2);

console.log(`\n\n===== 完成 =====`);
console.log(`收录卡片: ${totalCards} 张`);
console.log(`索引条目: ${totalEntries} 条`);
console.log(`文件大小: ${fileSizeMB} MB`);
console.log(`输出文件: ${OUT_FILE}`);