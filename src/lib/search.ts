// src/lib/search.ts

// ============ 字符串标准化 ============
export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ============ 匹配卡牌名称（中文名或英文名任一包含即可）============
export function matchCardName(
  name: string,
  nameEn: string | undefined,
  query: string
): boolean {
  const q = normalize(query);
  if (!q) return true;
  const cn = normalize(name || '');
  const en = nameEn ? normalize(nameEn) : '';
  return cn.includes(q) || (en !== '' && en.includes(q));
}

// ============ 匹配卡包名称（同时匹配名称和代码）============
export function matchPackName(
  name: string,
  code: string,
  query: string
): boolean {
  const q = normalize(query);
  if (!q) return true;
  return normalize(name).includes(q) || normalize(code).includes(q);
}

// ============ 稀有度排序权重 ============
export const RARITY_ORDER = [
  'Common',
  'Short Print',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Starlight Rare',
  'Quarter Century Secret Rare',
  "Collector's Rare",
];

export function rarityWeight(r: string): number {
  const i = RARITY_ORDER.indexOf(r);
  return i === -1 ? 999 : i;
}

// ============ 种族中文映射 ============
export const RACE_CN: Record<string, string> = {
  'Dragon': '龙',
  'Spellcaster': '魔法师',
  'Warrior': '战士',
  'Beast-Warrior': '兽战士',
  'Beast': '兽',
  'Winged Beast': '鸟兽',
  'Fiend': '恶魔',
  'Fairy': '天使',
  'Zombie': '不死',
  'Machine': '机械',
  'Aqua': '水',
  'Pyro': '炎',
  'Rock': '岩石',
  'Plant': '植物',
  'Insect': '昆虫',
  'Thunder': '雷',
  'Fish': '鱼',
  'Sea Serpent': '海龙',
  'Reptile': '爬虫类',
  'Dinosaur': '恐龙',
  'Psychic': '念动力',
  'Wyrm': '幻龙',
  'Cyberse': '电子界',
  'Illusion': '幻想',
  'Divine-Beast': '幻神兽',
  'Creator God': '创造神',
  'Normal': '通常',
  'Field': '场地',
  'Equip': '装备',
  'Continuous': '永续',
  'Quick-Play': '速攻',
  'Ritual': '仪式',
  'Counter': '反击',
};

// ============ 属性中文映射 ============
export const ATTRIBUTE_CN: Record<string, string> = {
  'DARK': '暗',
  'LIGHT': '光',
  'EARTH': '地',
  'WATER': '水',
  'FIRE': '炎',
  'WIND': '风',
  'DIVINE': '神',
};

// ============ 卡片大类（用于顶层筛选）============
export type CardGroup = 'monster' | 'spell' | 'trap' | 'extra' | 'other';

export function getCardGroup(card: { typeEn?: string; type?: string }): CardGroup {
  const t = ((card.typeEn || card.type) || '').toLowerCase();

  // 额外卡组怪兽
  if (
    t.includes('fusion') ||
    t.includes('synchro') ||
    t.includes('xyz') ||
    t.includes('link')
  ) {
    // 注意：Spell 里也有 "Continuous" 这种词，但没有 fusion 等
    return 'extra';
  }

  if (t.includes('spell')) return 'spell';
  if (t.includes('trap')) return 'trap';
  if (t.includes('monster') || t.includes('token')) return 'monster';
  return 'other';
}

// ============ 卡片中文类型标签 ============
export function getCardGroupCN(card: { typeEn?: string; type?: string }): string {
  const t = ((card.typeEn || card.type) || '').toLowerCase();

  if (t.includes('link')) return '连接怪兽';
  if (t.includes('xyz')) return '超量怪兽';
  if (t.includes('synchro')) return '同调怪兽';
  if (t.includes('fusion')) return '融合怪兽';
  if (t.includes('ritual') && t.includes('monster')) return '仪式怪兽';
  if (t.includes('pendulum') && t.includes('effect')) return '灵摆效果怪兽';
  if (t.includes('pendulum') && t.includes('normal')) return '灵摆通常怪兽';
  if (t.includes('pendulum')) return '灵摆怪兽';
  if (t.includes('flip')) return '反转效果怪兽';
  if (t.includes('toon')) return '卡通怪兽';
  if (t.includes('spirit')) return '灵魂怪兽';
  if (t.includes('union')) return '同盟怪兽';
  if (t.includes('gemini')) return '二重怪兽';
  if (t.includes('tuner')) return '调整怪兽';
  if (t.includes('effect')) return '效果怪兽';
  if (t.includes('normal') && t.includes('monster')) return '通常怪兽';
  if (t.includes('token')) return '衍生物';
  if (t.includes('monster')) return '怪兽';
  if (t.includes('spell')) return '魔法卡';
  if (t.includes('trap')) return '陷阱卡';
  return card.type || '未知';
}

// ============ 稀有度中文映射 ============
export const RARITY_CN: Record<string, string> = {
  'Common': '平卡',
  'Short Print': '短印',
  'Rare': '银字',
  'Super Rare': '面闪',
  'Ultra Rare': '金闪',
  'Secret Rare': '全息',
  'Ultimate Rare': '终极罕贵',
  'Ghost Rare': '鬼闪',
  'Starlight Rare': '星光',
  'Quarter Century Secret Rare': '25周年全息',
  "Collector's Rare": '典藏罕贵',
  'Extra Secret Rare': '额外全息',
  'Platinum Rare': '白金罕贵',
  'Gold Rare': '黄金罕贵',
  'Premium Gold Rare': '高级黄金',
};

export function rarityCN(r: string): string {
  return RARITY_CN[r] || r;
}