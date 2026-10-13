// scripts/fix-pendulum-desc.mjs
import fs from 'fs/promises';

const DB_FILE = './src/data/cards-db.json';

console.log('读取卡片库...');
const cardsDb = JSON.parse(await fs.readFile(DB_FILE, 'utf-8'));

let fixed = 0;
let checked = 0;

for (const [id, card] of Object.entries(cardsDb)) {
  checked++;

  // desc 是对象（百鸽灵摆卡格式）→ 拼接成字符串
  if (card.desc && typeof card.desc === 'object') {
    const pdesc = card.desc.pdesc || '';
    const mdesc = card.desc.desc || '';

    let combined = '';
    if (pdesc) combined += `【灵摆效果】\n${pdesc}`;
    if (pdesc && mdesc) combined += '\n\n';
    if (mdesc) combined += `【怪兽效果】\n${mdesc}`;

    card.desc = combined.trim();
    fixed++;
    console.log(`  修复 ${id}: ${card.name}`);
  }

  // 顺便处理 descEn 是对象的情况（英文接口偶尔也会）
  if (card.descEn && typeof card.descEn === 'object') {
    card.descEn = card.descEn.desc || '';
  }

  // types 字段也可能被存错位置
  if (card.desc && typeof card.desc === 'object' && card.desc.types) {
    // 已合并，忽略
  }
}

await fs.writeFile(DB_FILE, JSON.stringify(cardsDb, null, 2));

console.log(`\n检查 ${checked} 张，修复 ${fixed} 张`);