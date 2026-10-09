// src/lib/collection.ts
import type { CardData } from './draw';

const KEY = 'ygo-collection';

export interface OwnedCard {
  id: number;
  name: string;
  image: string;
  rarity: string;
  type?: string;
  desc?: string;
  count: number;
}

// 内部：读取并兼容旧数据格式（{id: number}）
function readRaw(): Record<number, OwnedCard> {
  const raw = localStorage.getItem(KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    const result: Record<number, OwnedCard> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (typeof value === 'number') {
        result[id] = {
          id,
          name: `未知卡片 #${id}`,
          image: '',
          rarity: '?',
          count: value,
        };
      } else if (value && typeof value === 'object') {
        result[id] = value as OwnedCard;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function addCardToCollection(card: CardData) {
  const data = readRaw();

  if (data[card.id]) {
    data[card.id].count += 1;
    // 补齐旧数据缺失的字段
    if (!data[card.id].image) data[card.id].image = card.image;
    if (!data[card.id].name || data[card.id].name.startsWith('未知卡片')) {
      data[card.id].name = card.name;
    }
    if (!data[card.id].type) data[card.id].type = card.type;
    if (!data[card.id].desc) data[card.id].desc = card.desc;
    if (data[card.id].rarity === '?') data[card.id].rarity = card.rarity;
  } else {
    data[card.id] = {
      id: card.id,
      name: card.name,
      image: card.image,
      rarity: card.rarity,
      type: card.type,
      desc: card.desc,
      count: 1,
    };
  }

  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getCollection(): OwnedCard[] {
  return Object.values(readRaw());
}

export function getCollectionMap(): Record<number, OwnedCard> {
  return readRaw();
}