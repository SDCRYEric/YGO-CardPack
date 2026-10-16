// src/lib/cardSets.ts

export interface CardSetEntry {
  code: string;
  name: string;
  rarity: string;
}

export type CardSetsIndex = Record<string, CardSetEntry[]>;

let cached: CardSetsIndex | null = null;
let loadingPromise: Promise<CardSetsIndex> | null = null;

export function loadCardSetsIndex(): Promise<CardSetsIndex> {
  if (cached) return Promise.resolve(cached);
  if (loadingPromise) return loadingPromise;

  loadingPromise = import('../data/card-sets-index.json').then(m => {
    cached = m.default as CardSetsIndex;
    return cached;
  });

  return loadingPromise;
}

export function getCardSets(cardId: number): Promise<CardSetEntry[]> {
  return loadCardSetsIndex().then(idx => idx[String(cardId)] || []);
}