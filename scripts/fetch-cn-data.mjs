// scripts/fetch-cn-data.mjs
import fs from 'fs/promises';
import path from 'path';

const SETS_FILE = './src/data/sets-list.json';
const OUT_DIR = './src/data/packs-cn';
const DB_FILE = './src/data/cards-db.json';
const DELAY_MS = 400;
const CARD_DELAY_MS = 120;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 加载已有的卡片库（断点续传）
let cardsDb = {};
try {
  const existing = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));
  cardsDb = existing;
  console.log(`已加载现有卡片库: ${Object.keys(cardsDb).length} 张\n`);
} catch {
  console.log('从头创建卡片库\n');
}

const setsRaw = await fs.readFile(SETS_FILE, 'utf-8');
const setsData = JSON.parse(setsRaw);

await fs.mkdir(OUT_DIR, { recursive: true });

// 按 code 去重
const seen = new Set();
const uniqueSets = [];
for (const s of setsData) {
  if (seen.has(s.code)) continue;
  seen.add(s.code);
  uniqueSets.push(s);
}

// 断点续传：跳过已生成的卡包文件
const existingFiles = new Set(
  (await fs.readdir(OUT_DIR))
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
);

console.log(`共 ${uniqueSets.length} 个卡包，已存在 ${existingFiles.size} 个\n`);

let success = 0, skipped = 0, failed = 0;
const pendingCards = new Map(); // cardId -> { name, nameEn, desc, descEn, image, type }

for (let i = 0; i < uniqueSets.length; i++) {
  const set = uniqueSets[i];
  const code = set.code;
  const fileName = `${code}.json`;

  if (existingFiles.has(code)) {
    skipped++;
    continue;
  }

  process.stdout.write(`[${i + 1}/${uniqueSets.length}] ${code} - ${set.name} ... `);

  try {
    // 1. 用 YGOPRODeck 获取卡片 ID 列表
    const enUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.name)}`;
    const enRes = await fetch(enUrl);
    if (!enRes.ok) {
      console.log(`EN HTTP ${enRes.status}`);
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    const enJson = await enRes.json();
    if (!enJson.data) {
      console.log('EN 无数据');
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    // 收集该卡包的卡片和稀有度
    const newPool = {};
    const setCards = [];

    for (const card of enJson.data) {
      const setInfo = card.card_sets?.find(s => s.set_name === set.name);
      if (!setInfo) continue;

      const rarity = setInfo.set_rarity;
      if (!newPool[rarity]) newPool[rarity] = [];
      newPool[rarity].push(card.id);

      // 如果卡片库中还没有这张卡，记下来待抓取中文
      if (!cardsDb[String(card.id)] && !pendingCards.has(card.id)) {
        pendingCards.set(card.id, {
          id: card.id,
          nameEn: card.name,
          descEn: card.desc,
          type: card.type,
        });
        setCards.push(card.id);
      }
    }

    // 2. 逐个从百鸽获取中文信息
    for (const cardId of setCards) {
      const pending = pendingCards.get(cardId);
      try {
        const cnRes = await fetch(`https://ygocdb.com/api/v0/card/${cardId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YGO-Pack-Sim/1.0)',
            'Accept': 'application/json',
          },
        });

        if (cnRes.ok) {
          const cnJson = await cnRes.json();
          const text = cnJson.text || {};
          pending.name = text.sc_name || text.name || pending.nameEn;
          pending.desc = text.desc || pending.descEn;
        }
      } catch {
        // 中文查询失败，后面用英文兜底
      }

      pending.image = `https://cdn.233.momobako.com/ygopro/pics/${cardId}.jpg`;
      await sleep(CARD_DELAY_MS);
    }

    // 3. 写入卡片库
    for (const [cardId, pending] of pendingCards) {
      if (!cardsDb[String(cardId)]) {
        cardsDb[String(cardId)] = {
          id: pending.id,
          name: pending.name || pending.nameEn,
          nameEn: pending.nameEn,
          desc: pending.desc || pending.descEn || '',
          descEn: pending.descEn || '',
          image: pending.image,
          type: pending.type || '',
        };
      }
    }

    // 4. 写入卡包索引
    await fs.writeFile(
      path.join(OUT_DIR, fileName),
      JSON.stringify({ setName: set.name, pool: newPool }, null, 2)
    );

    const totalCards = Object.values(newPool).flat().length;
    console.log(`✓ ${totalCards} 张`);
    success++;
  } catch (err) {
    console.log(`错误: ${err.message}`);
    failed++;
  }

  await sleep(DELAY_MS);
}

// 保存卡片库
await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));

console.log(`\n===== 完成 =====`);
console.log(`成功: ${success}  跳过: ${skipped}  失败: ${failed}`);
console.log(`卡片库总数: ${Object.keys(cardsDb).length}`);
console.log(`输出目录: ${OUT_DIR}`);