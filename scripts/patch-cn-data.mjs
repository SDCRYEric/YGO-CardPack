// scripts/patch-cn-data.mjs
import fs from 'fs/promises';

const DB_FILE = './src/data/cards-db.json';
const CARD_DELAY_MS = 250;
const SAVE_EVERY = 50;

const CN_RE = /[\u4e00-\u9fa5]/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('读取卡片库...');
const cardsDb = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));
const allIds = Object.keys(cardsDb);

const todo = allIds.filter(id => {
  const card = cardsDb[id];
  return !card.name || !CN_RE.test(card.name);
});

console.log(`需要补中文的: ${todo.length} 张\n`);

let done = 0, success = 0, failed = 0;
const failures = [];

for (const id of todo) {
  const card = cardsDb[id];
  let ok = false;

  // 尝试 1：按 passcode 查
  try {
    const res = await fetch(`https://ygocdb.com/api/v0/card/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json();
      const text = json.text || {};
      const cnName = text.sc_name || text.name;
      if (cnName && CN_RE.test(cnName)) {
        card.name = cnName;
      if (text.desc) {
        if (typeof text.desc === 'string') {
          card.desc = text.desc;
        } else if (typeof text.desc === 'object') {
          // 灵摆卡格式：{ types, pdesc, desc }
          const pdesc = text.desc.pdesc || '';
          const mdesc = text.desc.desc || '';
          let combined = '';
          if (pdesc) combined += `【灵摆效果】\n${pdesc}`;
          if (pdesc && mdesc) combined += '\n\n';
          if (mdesc) combined += `【怪兽效果】\n${mdesc}`;
          card.desc = combined.trim();
        }
      }
        ok = true;
      }
    }
  } catch (e) {
    // 静默失败
  }

  await sleep(CARD_DELAY_MS);

  // 尝试 2：按英文名搜索
  if (!ok && card.nameEn) {
    try {
      const res = await fetch(
        `https://ygocdb.com/api/v0/?search=${encodeURIComponent(card.nameEn)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const results = json.result || json;
        const list = Array.isArray(results) ? results : [];

        // 优先匹配 en_name 完全一致的
        let match = list.find(c =>
          (c.en_name || '').toLowerCase() === card.nameEn.toLowerCase()
        );
        if (!match) match = list[0];

        if (match) {
          const cnName = match.cn_name || match.sc_name || match.name;
          if (cnName && CN_RE.test(cnName)) {
            card.name = cnName;
            const rawDesc = match.cn_text || match.text;
          if (typeof rawDesc === 'string') {
            card.desc = rawDesc;
          } else if (rawDesc && typeof rawDesc === 'object') {
            const pdesc = rawDesc.pdesc || '';
            const mdesc = rawDesc.desc || '';
            let combined = '';
            if (pdesc) combined += `【灵摆效果】\n${pdesc}`;
            if (pdesc && mdesc) combined += '\n\n';
            if (mdesc) combined += `【怪兽效果】\n${mdesc}`;
            card.desc = combined.trim();
          }
            if (match.id) {
              card.image = `https://cdn.233.momobako.com/ygopro/pics/${match.id}.jpg`;
            }
            ok = true;
          }
        }
      }
    } catch (e) {
      // 静默失败
    }
    await sleep(CARD_DELAY_MS);
  }

  // 无论如何都把图换到中文 CDN
  card.image = `https://cdn.233.momobako.com/ygopro/pics/${id}.jpg`;

  if (ok) success++;
  else {
    failed++;
    if (failures.length < 20) {
      failures.push({ id, name: card.nameEn || card.name });
    }
  }

  done++;
  if (done % 10 === 0) {
    process.stdout.write(`\r进度 ${done}/${todo.length}  成功 ${success}  失败 ${failed}`);
  }
  if (done % SAVE_EVERY === 0) {
    await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));
  }
}

await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));

console.log(`\n\n===== 完成 =====`);
console.log(`处理 ${done}  成功 ${success}  失败 ${failed}`);
if (failures.length > 0) {
  console.log(`\n仍然失败的卡（前 20 张）：`);
  for (const f of failures) {
    console.log(`  ${f.id}  ${f.name}`);
  }
}