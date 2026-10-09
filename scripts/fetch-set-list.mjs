// scripts/fetch-sets-list.mjs
import fs from 'fs/promises';

const url = 'https://db.ygoprodeck.com/api/v7/cardsets.php';
const res = await fetch(url);
const sets = await res.json();

// 简单处理一下数据，只保留我们需要的字段
const cleanSets = sets.map(set => ({
  name: set.set_name,
  code: set.set_code,
  cardCount: set.num_of_cards,
  releaseDate: set.tcg_date,
  coverImage: set.set_image,
}));

await fs.mkdir('src/data', { recursive: true });
await fs.writeFile(
  'src/data/sets-list.json',
  JSON.stringify(cleanSets, null, 2)
);

console.log(`已获取 ${cleanSets.length} 个卡包信息`);