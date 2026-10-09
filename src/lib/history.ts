// src/lib/history.ts
const KEY = 'ygo-history';
const MAX_ENTRIES = 200;

export interface HistoryCard {
  id: number;
  name: string;
  image: string;
  rarity: string;
  type?: string;
  desc?: string;
}

export interface HistoryEntry {
  id: string;
  setId: string;
  setName: string;
  timestamp: number;
  cards: HistoryCard[];
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
  const raw = localStorage.getItem(KEY);
  const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];

  list.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });

  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getHistory(): HistoryEntry[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function deleteHistoryEntry(id: string) {
  const list = getHistory().filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}