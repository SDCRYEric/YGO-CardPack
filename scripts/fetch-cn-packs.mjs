// scripts/fetch-cn-packs.mjs
import fs from 'fs/promises';

const OUT_DIR = './src/data/packs-cn';
const DELAY_MS = 500;

const setsRaw = await fs.readFile('./src/data/sets-list.json', 'utf-8');
const setsData = JSON.parse(setsRaw);

await fs.mkdir(OUT_DIR, { recursive: true });

// 去重
const seen = new Set();
const uniqueSets = [];
for (const s of setsData) {
  if (seen.has(s.code)) continue;
  seen.add(s.code);
  uniqueSets.push(s);
}

for (let i = 0; i < uniqueSets.length; i++) {
  const set = uniqueSets[i];
  const fileName = `${set.code}.json`;

  // 断点续传：已存在的跳过
  try {
    await fs.access(`${OUT_DIR}/${fileName}`);
    continue;
  } catch { /* 文件不存在，继续 */ }

  process.stdout.write(`[${i + 1}/${uniqueSets.length}] ${set.code} - ${set.name} ... `);

  try {
    // 1. 用 YGOPRODeck 获取该卡包的英文卡牌列表（含 passcode）
    const enUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(set.name)}`;
    const enRes = await fetch(enUrl);
    if (!enRes.ok) { console.log(`HTTP ${enRes.status}`); continue; }
    const enJson = await enRes.json();
    if (!enJson.data) { console.log('无数据'); continue; }

    const pool = {};
    for (const card of enJson.data) {
      const setInfo = card.card_sets?.find(s => s.set_name === set.name);
      if (!setInfo) continue;
      const rarity = setInfo.set_rarity;

      // 2. 用百鸽 API 查询这张卡的中文信息
      let cnName = card.name;
      let cnDesc = card.desc;
      let cnImage = card.card_images[0].image_url_small;

      try {
        const cnRes = await fetch(
          `https://ygocdb.com/api/v0/?search=${encodeURIComponent(card.name)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; YGO-Pack-Sim/1.0)',
              'Accept': 'application/json',
            },
          }
        );
        if (cnRes.ok) {
          const cnJson = await cnRes.json();
          // 百鸽返回的是数组，找到 id 匹配的那张
          const match = (cnJson.result || cnJson).find?.(
            c => c.id === card.id || c.cid === card.id
          ) || (cnJson.result || cnJson)[0];

          if (match) {
            cnName = match.cn_name || match.name || cnName;
            cnDesc = match.cn_text || match.desc || cnDesc;
            // 中文卡图 CDN
            cnImage = `https://cdn.233.momobako.com/ygopro/pics/${card.id}.jpg`;
          }
        }
      } catch (cnErr) {
        // 百鸽查询失败，保留英文
      }

      if (!pool[rarity]) pool[rarity] = [];
      pool[rarity].push({
        id: card.id,
        name: cnName,
        desc: cnDesc,
        image: cnImage,
        type: card.type,
        rarity,
      });
    }

    const total = Object.values(pool).flat().length;
    await fs.writeFile(
      `${OUT_DIR}/${fileName}`,
      JSON.stringify({ setName: set.name, pool }, null, 2)
    );
    console.log(`✓ ${total} 张`);
  } catch (err) {
    console.log(`错误: ${err.message}`);
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

console.log('\n全部完成！');