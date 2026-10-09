// src/lib/deck.ts
const KEY = 'ygo-decks';

export interface Deck {
  id: string;
  name: string;
  main: Record<number, number>; // cardId -> 数量
  createdAt: number;
  updatedAt: number;
}

export const DECK_RULES = {
  MIN_MAIN: 40,
  MAX_MAIN: 60,
  MAX_COPIES: 3,
};

export function getDecks(): Deck[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getDeck(id: string): Deck | null {
  return getDecks().find(d => d.id === id) || null;
}

export function saveDeck(deck: Deck) {
  const decks = getDecks();
  const idx = decks.findIndex(d => d.id === deck.id);
  const now = Date.now();

  if (idx >= 0) {
    decks[idx] = { ...deck, updatedAt: now };
  } else {
    decks.unshift({ ...deck, createdAt: now, updatedAt: now });
  }

  localStorage.setItem(KEY, JSON.stringify(decks));
}

export function deleteDeck(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getDecks().filter(d => d.id !== id)));
}

export function createDeck(name: string): Deck {
  const now = Date.now();
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || '新卡组',
    main: {},
    createdAt: now,
    updatedAt: now,
  };
}