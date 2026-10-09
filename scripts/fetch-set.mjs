import fs from 'fs/promises';

const setName = 'Legend of Blue Eyes White Dragon';
const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(setName)}`;

const res = await fetch(url);
const json = await res.json();

const pool = {};

for (const card of json.data) {
  const setInfo = card.card_sets?.find(s => s.set_name === setName);
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

await fs.mkdir('src/data/sets', { recursive: true });
await fs.writeFile(
  'src/data/sets/lob.json',
  JSON.stringify({ setName, pool }, null, 2)
);

console.log('done');