// src/lib/boxes.ts
import type { VirtualBox } from './draw';

const KEY = 'ygo-virtual-boxes';

export interface BoxState {
  cardIds: number[];
  rarities: string[];
  totalCards: number;
  drawnCount: number;
  guaranteeCounter: number;
  srGuaranteeCounter: number;
  updatedAt: number;
}

type BoxMap = Record<string, BoxState>;

function read(): BoxMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getBoxState(setId: string): BoxState | null {
  return read()[setId] || null;
}

export function saveBoxState(setId: string, box: VirtualBox) {
  const data = read();
  data[setId] = {
    cardIds: box.cards.map(c => c.id),
    rarities: box.cards.map(c => c.rarity),
    totalCards: box.totalCards,
    drawnCount: box.drawnCount,
    guaranteeCounter: box.guaranteeCounter,
    srGuaranteeCounter: box.srGuaranteeCounter,
    updatedAt: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearBoxState(setId: string) {
  const data = read();
  delete data[setId];
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getAllBoxStates(): BoxMap {
  return read();
}