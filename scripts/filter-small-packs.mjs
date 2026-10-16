// scripts/filter-small-packs.mjs
import fs from 'fs/promises';
import path from 'path';

const PACKS_DIR = './src/data/packs-cn';
const OUT_FILE = './src/data/hidden-codes.json';
const MIN_CARDS = 20; // 卡片数阈值

const files = (await fs.readdir(PACKS_DIR)).filter(f => f.endsWith('.json'));
console.log(`扫描 ${files.length} 个卡包...`);

// code -> Set<cardId>
const packs = {};
// cardId -> Set<code>
const cardToCodes = {};

// ===== 第一步：读取所有卡包，构建映射 =====
for (const file of files) {
  const code = file.replace('.json', '');
  try {
    const data = JSON.parse(
      await fs.readFile(path.join(PACKS_DIR, file), 'utf-8')
    );
    if (!data.pool) continue;

    const ids = new Set();
    for (const list of Object.values(data.pool)) {
      if (!Array.isArray(list)) continue;
      for (const id of list) ids.add(id);
    }
    packs[code] = ids;

    for (const id of ids) {
      if (!cardToCodes[id]) cardToCodes[id] = new Set();
      cardToCodes[id].add(code);
    }
  } catch (err) {
    console.warn(`跳过 ${file}: ${err.message}`);
  }
}

// ===== 第二步：判断哪些卡包要隐藏 =====
const hidden = [];
const keptSmall = [];
const keptLarge = [];

for (const [code, ids] of Object.entries(packs)) {
  // 卡片数 >= 阈值，保留
  if (ids.size >= MIN_CARDS) {
    keptLarge.push(code);
    continue;
  }

  // 小卡包：检查是否有"独有卡"
  let hasUnique = false;
  for (const id of ids) {
    if (cardToCodes[id].size === 1) {
      hasUnique = true;
      break;
    }
  }

  if (hasUnique) {
    keptSmall.push(code);
  } else {
    hidden.push(code);
  }
}

// ===== 第三步：写入文件 =====
await fs.writeFile(
  OUT_FILE,
  JSON.stringify(
    {
      threshold: MIN_CARDS,
      generatedAt: new Date().toISOString(),
      hidden: hidden.sort(),
    },
    null,
    2
  )
);

console.log(`\n===== 完成 =====`);
console.log(`卡片数 >= ${MIN_CARDS} 的卡包: ${keptLarge.length} 个`);
console.log(`卡片数 < ${MIN_CARDS} 但含独有卡（保留）: ${keptSmall.length} 个`);
console.log(`卡片数 < ${MIN_CARDS} 且无独有卡（隐藏）: ${hidden.length} 个`);
console.log(`\n隐藏列表已写入: ${OUT_FILE}`);

if (hidden.length > 0) {
  console.log(`\n被隐藏的卡包代码（前 20 个）：`);
  for (const code of hidden.slice(0, 20)) {
    console.log(`  ${code}`);
  }
  if (hidden.length > 20) console.log(`  ... 还有 ${hidden.length - 20} 个`);
}