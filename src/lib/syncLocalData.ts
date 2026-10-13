// src/lib/syncLocalData.ts
import { loadCardsDb } from './cardsDb';

const CN_RE = /[\u4e00-\u9fa5]/;

export async function syncLocalData(): Promise<{
  collectionFixed: number;
  historyFixed: number;
}> {
  const db = await loadCardsDb();

  let collectionFixed = 0;
  let historyFixed = 0;

  // ===== 1. 同步卡库 =====
  const collKey = 'ygo-collection';
  const collRaw = localStorage.getItem(collKey);

  if (collRaw) {
    try {
      const data = JSON.parse(collRaw);
      for (const id of Object.keys(data)) {
        const entry = data[id];
        if (!entry || typeof entry !== 'object') continue;

        const info = db[id];
        if (!info) continue;

        // 名字或描述不含中文 → 用 cards-db 覆盖
        const nameIsEn = entry.name && !CN_RE.test(entry.name);
        const descIsEn = entry.desc && !CN_RE.test(entry.desc);

        if (nameIsEn || descIsEn) {
          entry.name = info.name;
          entry.nameEn = info.nameEn;
          entry.image = info.image;
          entry.type = info.type;
          entry.typeEn = info.typeEn;
          entry.race = info.race;
          entry.attribute = info.attribute;
          entry.atk = info.atk;
          entry.def = info.def;
          entry.level = info.level;
          entry.linkval = info.linkval;
          entry.desc = info.desc;
          collectionFixed++;
        }
      }
      localStorage.setItem(collKey, JSON.stringify(data));
    } catch (e) {
      console.warn('同步卡库失败:', e);
    }
  }

  // ===== 2. 同步历史记录 =====
  const histKey = 'ygo-history';
  const histRaw = localStorage.getItem(histKey);

  if (histRaw) {
    try {
      const list = JSON.parse(histRaw);
      if (Array.isArray(list)) {
        for (const entry of list) {
          if (!entry || !Array.isArray(entry.cards)) continue;
          for (const card of entry.cards) {
            if (!card || typeof card !== 'object') continue;

            const info = db[String(card.id)];
            if (!info) continue;

            const nameIsEn = card.name && !CN_RE.test(card.name);
            const descIsEn = card.desc && !CN_RE.test(card.desc);

            if (nameIsEn || descIsEn) {
              card.name = info.name;
              card.nameEn = info.nameEn;
              card.image = info.image;
              card.type = info.type;
              card.typeEn = info.typeEn;
              card.race = info.race;
              card.attribute = info.attribute;
              card.atk = info.atk;
              card.def = info.def;
              card.level = info.level;
              card.linkval = info.linkval;
              card.desc = info.desc;
              historyFixed++;
            }
          }
        }
        localStorage.setItem(histKey, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('同步历史失败:', e);
    }
  }

  return { collectionFixed, historyFixed };
}