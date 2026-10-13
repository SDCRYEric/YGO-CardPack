// src/lib/advancedFilter.ts
import type { CardInfo } from './cardsDb';

export interface AdvancedFilters {
  groups: string[];
  monsterKinds: string[];
  attributes: string[];
  races: string[];
  levels: number[];
  scales: number[];
  spellKinds: string[];
  trapKinds: string[];
  atkMin?: number;
  atkMax?: number;
  defMin?: number;
  defMax?: number;
  unknownAtk?: boolean;
  rarities: string[];
}

export const EMPTY_FILTERS: AdvancedFilters = {
  groups: [],
  monsterKinds: [],
  attributes: [],
  races: [],
  levels: [],
  scales: [],
  spellKinds: [],
  trapKinds: [],
  rarities: [],
};

export function isFilterEmpty(f: AdvancedFilters): boolean {
  return (
    f.groups.length === 0 &&
    f.monsterKinds.length === 0 &&
    f.attributes.length === 0 &&
    f.races.length === 0 &&
    f.levels.length === 0 &&
    f.scales.length === 0 &&
    f.spellKinds.length === 0 &&
    f.trapKinds.length === 0 &&
    f.rarities.length === 0 &&
    f.atkMin === undefined &&
    f.atkMax === undefined &&
    f.defMin === undefined &&
    f.defMax === undefined &&
    !f.unknownAtk
  );
}

export function countActiveFilters(f: AdvancedFilters): number {
  let n = 0;
  n += f.groups.length;
  n += f.monsterKinds.length;
  n += f.attributes.length;
  n += f.races.length;
  n += f.levels.length;
  n += f.scales.length;
  n += f.spellKinds.length;
  n += f.trapKinds.length;
  n += f.rarities.length;
  if (f.atkMin !== undefined || f.atkMax !== undefined) n++;
  if (f.defMin !== undefined || f.defMax !== undefined) n++;
  if (f.unknownAtk) n++;
  return n;
}

function getMonsterKind(card: CardInfo): string[] {
  const t = ((card.typeEn || card.type) || '').toLowerCase();
  const kinds: string[] = [];
  if (t.includes('link')) kinds.push('link');
  else if (t.includes('xyz')) kinds.push('xyz');
  else if (t.includes('synchro')) kinds.push('synchro');
  else if (t.includes('fusion')) kinds.push('fusion');
  else if (t.includes('ritual')) kinds.push('ritual');
  if (t.includes('pendulum')) kinds.push('pendulum');
  if (t.includes('normal') && t.includes('monster')) kinds.push('normal');
  if (t.includes('effect')) kinds.push('effect');
  if (t.includes('token')) kinds.push('token');
  return kinds;
}

function getSpellTrapKind(card: CardInfo): string | null {
  const t = ((card.typeEn || card.type) || '').toLowerCase();
  if (t.includes('spell')) {
    if (t.includes('quick')) return 'quick';
    if (t.includes('continuous')) return 'continuous';
    if (t.includes('equip')) return 'equip';
    if (t.includes('field')) return 'field';
    if (t.includes('ritual')) return 'ritual';
    return 'normal';
  }
  if (t.includes('trap')) {
    if (t.includes('counter')) return 'counter';
    if (t.includes('continuous')) return 'continuous';
    return 'normal';
  }
  return null;
}

export function matchesAdvancedFilters(
  card: CardInfo & { rarity?: string },
  f: AdvancedFilters
): boolean {
  const t = ((card.typeEn || card.type) || '').toLowerCase();

  if (f.groups.length > 0) {
    let group = 'other';
    if (t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link')) {
      group = 'extra';
    } else if (t.includes('spell')) group = 'spell';
    else if (t.includes('trap')) group = 'trap';
    else if (t.includes('monster') || t.includes('token')) group = 'monster';
    if (!f.groups.includes(group)) return false;
  }

  if (f.monsterKinds.length > 0) {
    const kinds = getMonsterKind(card);
    if (!kinds.some(k => f.monsterKinds.includes(k))) return false;
  }

  if (f.attributes.length > 0) {
    if (!card.attribute || !f.attributes.includes(card.attribute)) return false;
  }

  if (f.races.length > 0) {
    if (!card.race || !f.races.includes(card.race)) return false;
  }

  if (f.levels.length > 0) {
    const lv = card.level ?? card.linkval;
    if (lv === undefined || !f.levels.includes(lv)) return false;
  }

  if (f.spellKinds.length > 0 || f.trapKinds.length > 0) {
    const k = getSpellTrapKind(card);
    if (!k) return false;
    if (t.includes('spell') && !f.spellKinds.includes(k)) return false;
    if (t.includes('trap') && !f.trapKinds.includes(k)) return false;
  }

  if (f.atkMin !== undefined) {
    if (card.atk === undefined || card.atk < f.atkMin) return false;
  }
  if (f.atkMax !== undefined) {
    if (card.atk === undefined || card.atk > f.atkMax) return false;
  }
  if (f.unknownAtk) {
    if (card.atk !== -1 && card.atk !== undefined) return false;
  }
  if (f.defMin !== undefined) {
    if (card.def === undefined || card.def < f.defMin) return false;
  }
  if (f.defMax !== undefined) {
    if (card.def === undefined || card.def > f.defMax) return false;
  }

  if (f.rarities.length > 0) {
    if (!card.rarity || !f.rarities.includes(card.rarity)) return false;
  }

  return true;
}