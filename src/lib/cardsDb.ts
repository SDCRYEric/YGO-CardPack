// src/lib/cardsDb.ts

export interface CardInfo {
  id: number;
  name: string;
  nameEn?: string;
  desc?: string;
  descEn?: string;
  image: string;
  type?: string;         // 中文或英文的卡片类型描述
  typeEn?: string;       // 英文卡片类型，用于精确分类
  race?: string;         // 种族，如 "Dragon", "Spellcaster"
  attribute?: string;    // 属性，如 "DARK", "LIGHT"
  atk?: number;
  def?: number;
  level?: number;
  linkval?: number;
  archetype?: string;
  rarities?: string[];
}

export type CardsDb = Record<string, CardInfo>;

let cached: CardsDb | null = null;
let loadingPromise: Promise<CardsDb> | null = null;

export function loadCardsDb(): Promise<CardsDb> {
  if (cached) return Promise.resolve(cached);
  if (loadingPromise) return loadingPromise;

  loadingPromise = import('../data/cards-db.json').then(m => {
    cached = m.default as CardsDb;
    return cached;
  });

  return loadingPromise;
}

export function getCardInfo(db: CardsDb, id: number): CardInfo | undefined {
  return db[String(id)];
}