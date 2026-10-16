// src/lib/draw.ts
import type { CardsDb, CardInfo } from './cardsDb';
import type { BoxState } from './boxes';

// 最终用于展示的卡片（含稀有度）
export interface CardData extends CardInfo {
  rarity: string;
}

// 卡包索引：稀有度 -> 卡片 ID 列表（新格式）
export type CardPoolIndex = Record<string, number[]>;

// 解析后的卡池：稀有度 -> 完整卡片
export type CardPool = Record<string, CardData[]>;

export interface PackConfig {
  id: string;
  name: string;
  cardsPerPack: number;
  rarityWeights: Record<string, number>;
  rarityOrder: string[];
  guarantee: string;
}

// 把卡包索引 + 卡片库 解析成完整卡池
export function resolvePool(index: CardPoolIndex, db: CardsDb): CardPool {
  const result: CardPool = {};
  for (const [rarity, ids] of Object.entries(index)) {
    if (!Array.isArray(ids)) continue;
    const cards: CardData[] = [];
    for (const id of ids) {
      const info = db[String(id)];
      if (!info) continue;
      cards.push({ ...info, rarity });
    }
    result[rarity] = cards;
  }
  return result;
}

// ============= 以下部分保持原样 =============

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

// ============= 虚拟卡盒 =============

export interface VirtualBox {
  cards: CardData[];
  totalCards: number;
  drawnCount: number;
  guaranteeCounter: number;
  srGuaranteeCounter: number;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const BOX_DISTRIBUTION: Record<string, number> = {
  'Secret Rare': 2,
  'Ultra Rare': 6,
  'Super Rare': 10,
  'Rare': 30,
  'Common': 150,
};

function isURPlus(rarity: string) {
  return rarity.includes('Ultra') || rarity.includes('Secret');
}
function isSRPlus(rarity: string) {
  return rarity.includes('Super') || isURPlus(rarity);
}

export function buildVirtualBox(pool: CardPool): VirtualBox {
  const cards: CardData[] = [];
  const usedRarities = new Set<string>();

  for (const [rarity, count] of Object.entries(BOX_DISTRIBUTION)) {
    const list = pool[rarity];
    if (!list || list.length === 0) continue;
    usedRarities.add(rarity);
    for (let i = 0; i < count; i++) {
      cards.push(list[i % list.length]);
    }
  }

  for (const [rarity, list] of Object.entries(pool)) {
    if (usedRarities.has(rarity)) continue;
    if (!list || list.length === 0) continue;
    for (const card of list) cards.push(card);
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

export function drawTenFromBox(box: VirtualBox, cardsPerPack: number): CardData[] {
  const allCards: CardData[] = [];
  for (let pack = 0; pack < 10; pack++) {
    allCards.push(...drawFromBox(box, cardsPerPack));
  }

  const hasSRPlus = allCards.some(c => isSRPlus(c.rarity));
  if (!hasSRPlus) {
    const idx = box.cards.findIndex(c => isSRPlus(c.rarity));
    if (idx >= 0) {
      const [picked] = box.cards.splice(idx, 1);
      allCards[allCards.length - 1] = picked;
    }
  }

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

export function getRemainingInBox(box: VirtualBox, cardsPerPack: number): number {
  return Math.ceil(box.cards.length / cardsPerPack);
}

// ============= 从持久化状态恢复虚拟盒（修复版）=============

export function restoreBoxFromState(
  state: BoxState,
  db: Record<string, CardInfo>
): VirtualBox | null {
  // 旧存档没有 rarities → 视为无效，让调用方重建
  if (!state.rarities || state.rarities.length !== state.cardIds.length) {
    return null;
  }

  const cards: CardData[] = [];
  for (let i = 0; i < state.cardIds.length; i++) {
    const id = state.cardIds[i];
    const info = db[String(id)];
    if (!info) continue; // 卡片库没有这张卡，跳过
    cards.push({ ...info, rarity: state.rarities[i] });
  }

  return {
    cards,
    totalCards: state.totalCards,
    drawnCount: state.drawnCount,
    guaranteeCounter: state.guaranteeCounter,
    srGuaranteeCounter: state.srGuaranteeCounter,
  };
}

// 判断虚拟盒是否抽干
export function isBoxDried(box: VirtualBox): boolean {
  return box.cards.length === 0;
}