// src/lib/draw.ts

export interface CardData {
  id: number;
  name: string;
  image: string;
  rarity: string;
  type?: string;
  desc?: string;
}

export type CardPool = Record<string, CardData[]>;

export interface PackConfig {
  id: string;
  name: string;
  cardsPerPack: number;
  rarityWeights: Record<string, number>;
  rarityOrder: string[];
  guarantee: string;
}

// ============= 原有逻辑（保留，供其他地方使用） =============

function weightedRarity(weights: Record<string, number>, pool: CardPool): string {
  const available = Object.entries(weights).filter(([rarity]) => pool[rarity]?.length);
  const total = available.reduce((sum, [, weight]) => sum + weight, 0);

  let random = Math.random() * total;
  for (const [rarity, weight] of available) {
    random -= weight;
    if (random <= 0) return rarity;
  }
  return available[0][0];
}

export function drawCard(pool: CardPool, weights: Record<string, number>): CardData {
  const rarity = weightedRarity(weights, pool);
  const list = pool[rarity];
  return list[Math.floor(Math.random() * list.length)];
}

export function drawPack(pool: CardPool, config: PackConfig): CardData[] {
  const cards: CardData[] = [];
  for (let i = 0; i < config.cardsPerPack; i++) {
    cards.push(drawCard(pool, config.rarityWeights));
  }

  const guaranteeIndex = config.rarityOrder.indexOf(config.guarantee);
  const hasGuarantee = cards.some(
    card => config.rarityOrder.indexOf(card.rarity) >= guaranteeIndex
  );
  if (!hasGuarantee && pool[config.guarantee]?.length) {
    const list = pool[config.guarantee];
    cards[cards.length - 1] = list[Math.floor(Math.random() * list.length)];
  }
  return cards;
}

// ============= 虚拟卡盒（决斗链接风格） =============

export interface VirtualBox {
  cards: CardData[];
  totalCards: number;
  drawnCount: number;
  guaranteeCounter: number;    // 连续未出 UR 的十连计数
  srGuaranteeCounter: number;  // 连续未出 SR 的十连计数
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// 稀有度在盒中的固定张数（可根据需要调整）
const BOX_DISTRIBUTION: Record<string, number> = {
  'Secret Rare': 2,
  'Ultra Rare': 6,
  'Super Rare': 10,
  'Rare': 30,
  'Common': 150,
};

// 判断稀有度是否属于某个等级
function isURPlus(rarity: string) {
  return rarity.includes('Ultra') || rarity.includes('Secret');
}
function isSRPlus(rarity: string) {
  return rarity.includes('Super') || isURPlus(rarity);
}

// 生成一个虚拟卡盒
export function buildVirtualBox(pool: CardPool): VirtualBox {
  const cards: CardData[] = [];

  // 优先按预定义分配；如果卡池里没有这些稀有度，就把剩下的卡补进来
  const usedRarities = new Set<string>();

  for (const [rarity, count] of Object.entries(BOX_DISTRIBUTION)) {
    const list = pool[rarity];
    if (!list || list.length === 0) continue;
    usedRarities.add(rarity);
    for (let i = 0; i < count; i++) {
      cards.push(list[i % list.length]);
    }
  }

  // 把未在分配表里出现过的稀有度也补进去（每种至少放一张）
  for (const [rarity, list] of Object.entries(pool)) {
    if (usedRarities.has(rarity)) continue;
    if (!list || list.length === 0) continue;
    for (const card of list) {
      cards.push(card);
    }
  }

  shuffle(cards);

  return {
    cards,
    totalCards: cards.length,
    drawnCount: 0,
    guaranteeCounter: 0,
    srGuaranteeCounter: 0,
  };
}

// 从盒中抽一包（不放回）
export function drawFromBox(box: VirtualBox, cardsPerPack: number): CardData[] {
  const result: CardData[] = [];

  for (let i = 0; i < cardsPerPack; i++) {
    if (box.cards.length === 0) break;
    const idx = Math.floor(Math.random() * box.cards.length);
    result.push(box.cards.splice(idx, 1)[0]);
    box.drawnCount++;
  }

  const hasUR = result.some(c => isURPlus(c.rarity));
  const hasSR = result.some(c => isSRPlus(c.rarity));

  box.guaranteeCounter = hasUR ? 0 : box.guaranteeCounter + 1;
  box.srGuaranteeCounter = hasSR ? 0 : box.srGuaranteeCounter + 1;

  return result;
}

// 十连抽（带 SR 保底 + 十连大保底 UR）
export function drawTenFromBox(box: VirtualBox, cardsPerPack: number): CardData[] {
  const allCards: CardData[] = [];

  for (let pack = 0; pack < 10; pack++) {
    allCards.push(...drawFromBox(box, cardsPerPack));
  }

  // SR 保底：整个十连没有 SR 以上，就替换最后一张
  const hasSRPlus = allCards.some(c => isSRPlus(c.rarity));
  if (!hasSRPlus) {
    const idx = box.cards.findIndex(c => isSRPlus(c.rarity));
    if (idx >= 0) {
      const [picked] = box.cards.splice(idx, 1);
      allCards[allCards.length - 1] = picked;
    }
  }

  // UR 大保底：连续 10 个十连没出 UR
  if (box.guaranteeCounter >= 10) {
    const idx = box.cards.findIndex(c => isURPlus(c.rarity));
    if (idx >= 0) {
      const [picked] = box.cards.splice(idx, 1);
      allCards[allCards.length - 1] = picked;
      box.guaranteeCounter = 0;
    }
  }

  return allCards;
}

// 盒中剩余卡数（用于界面提示）
export function getRemainingInBox(box: VirtualBox, cardsPerPack: number): number {
  return Math.ceil(box.cards.length / cardsPerPack);
}