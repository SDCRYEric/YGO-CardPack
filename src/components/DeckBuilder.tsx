import { useState, useMemo, useEffect } from 'react';
import { getCollectionMap, type OwnedCard } from '../lib/collection';
import { getDeck, saveDeck, DECK_RULES, type Deck } from '../lib/deck';
import { useCardPreview } from './CardPreviewProvider';
import FilterPanel from './FilterPanel';
import {
  AdvancedFilters,
  EMPTY_FILTERS,
  matchesAdvancedFilters,
} from '../lib/advancedFilter';
import { matchCardName, rarityWeight, rarityCN } from '../lib/search';

interface Props {
  deckId: string;
  onBack: () => void;
}

export default function DeckBuilder({ deckId, onBack }: Props) {
  const [deck, setDeck] = useState<Deck | null>(getDeck(deckId));
  const [collection] = useState<Record<number, OwnedCard>>(getCollectionMap);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const { openPreview } = useCardPreview();
  const [filters, setFilters] = useState<AdvancedFilters>({ ...EMPTY_FILTERS });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const mainCount = deck
    ? Object.values(deck.main).reduce((s, n) => s + n, 0)
    : 0;

  const addCard = (cardId: number) => {
    if (!deck) return;
    const inDeck = deck.main[cardId] || 0;
    const owned = collection[cardId]?.count || 0;

    if (inDeck >= DECK_RULES.MAX_COPIES) {
      setToast(`同名卡最多放入 ${DECK_RULES.MAX_COPIES} 张`);
      return;
    }
    if (inDeck >= owned) {
      setToast(`卡库中只有 ${owned} 张`);
      return;
    }
    if (mainCount >= DECK_RULES.MAX_MAIN) {
      setToast(`主卡组最多 ${DECK_RULES.MAX_MAIN} 张`);
      return;
    }

    const updated = { ...deck, main: { ...deck.main, [cardId]: inDeck + 1 } };
    setDeck(updated);
    saveDeck(updated);
  };

  const removeCard = (cardId: number) => {
    if (!deck) return;
    const inDeck = deck.main[cardId] || 0;
    if (inDeck <= 0) return;

    const newMain = { ...deck.main };
    if (inDeck === 1) delete newMain[cardId];
    else newMain[cardId] = inDeck - 1;

    const updated = { ...deck, main: newMain };
    setDeck(updated);
    saveDeck(updated);
  };

  const renameDeck = () => {
    if (!deck) return;
    const name = prompt('修改卡组名称：', deck.name);
    if (name === null) return;
    const updated = { ...deck, name: name.trim() || deck.name };
    setDeck(updated);
    saveDeck(updated);
  };

  const clearDeck = () => {
    if (!deck) return;
    if (!confirm('清空当前卡组的所有卡片？')) return;
    const updated = { ...deck, main: {} };
    setDeck(updated);
    saveDeck(updated);
  };

  const collectionList = useMemo(() => {
  return Object.values(collection).filter(c => {
    const okSearch = matchCardName(c.name, c.nameEn, searchTerm);
    const okAdvanced = matchesAdvancedFilters(c as any, filters);
    return okSearch && okAdvanced;
  });
}, [collection, searchTerm, filters]);

  const deckCards = useMemo(() => {
    if (!deck) return [];
    return Object.entries(deck.main)
      .map(([id, count]) => {
        const card = collection[Number(id)];
        if (!card) return null;
        return { ...card, inDeck: count };
      })
      .filter((c): c is OwnedCard & { inDeck: number } => c !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deck, collection]);

  const rarities = useMemo(
    () => Array.from(new Set(Object.values(collection).map(c => c.rarity)))
      .sort((a, b) => rarityWeight(a) - rarityWeight(b)),
    [collection]
  );

  if (!deck) {
    return (
      <div className="deck-builder">
        <p>找不到该卡组。</p>
        <button onClick={onBack}>返回</button>
      </div>
    );
  }

  const validSize =
    mainCount >= DECK_RULES.MIN_MAIN && mainCount <= DECK_RULES.MAX_MAIN;

  return (
    <div className="deck-builder">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2 onClick={renameDeck} title="点击重命名" className="editable-title">
          {deck.name} ✎
        </h2>
        <button onClick={clearDeck} className="danger-btn-outline">清空卡组</button>
      </div>

      <div className="deck-builder-body">
        {/* 左：卡库 */}
        <div className="deck-builder-panel">
          <div className="panel-header">
            <h3>卡库</h3>
            <span className="panel-count">{collectionList.length} 种</span>
          </div>

          <div className="filters compact">
            <input
              type="text"
              placeholder="搜索卡名..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableRarities={rarities}
            />
          </div>

          <div className="deck-card-list">
            {collectionList.length === 0 && <p className="hint">没有可用的卡片。</p>}
            {collectionList.map(card => {
              const inDeck = deck.main[card.id] || 0;
              const maxed =
                inDeck >= DECK_RULES.MAX_COPIES || inDeck >= card.count;
              return (
                <div
                  key={card.id}
                  className={`deck-card-item ${maxed ? 'maxed' : ''}`}
                  onClick={() => addCard(card.id)}
                  title={maxed ? '已达上限' : '点击加入卡组'}
                >
                  {card.image && (
                    <img src={card.image} alt={card.name} loading="lazy" />
                  )}
                  <div className="deck-card-item-info">
                    <div className="deck-card-item-name">{card.name}</div>
                    <div className="deck-card-item-meta">
                      持有 {card.count} • 已入 {inDeck}
                    </div>
                  </div>
                  <button
                    className="info-btn"
                    onClick={e => {
                      e.stopPropagation();
                      openPreview(card as any);
                    }}
                    title="查看详情"
                  >
                    i
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右：卡组 */}
        <div className="deck-builder-panel">
          <div className="panel-header">
            <h3>主卡组</h3>
            <span className={`panel-count ${validSize ? 'valid' : ''}`}>
              {mainCount} / {DECK_RULES.MAX_MAIN}
            </span>
          </div>

          <div className="deck-summary">
            {mainCount < DECK_RULES.MIN_MAIN && (
              <p className="warning">
                还差 {DECK_RULES.MIN_MAIN - mainCount} 张达到最低 {DECK_RULES.MIN_MAIN} 张
              </p>
            )}
            {validSize && (
              <p className="success">✓ 卡组合法（{mainCount} 张）</p>
            )}
          </div>

          <div className="deck-card-list">
            {deckCards.length === 0 && (
              <p className="hint">卡组是空的。点击左侧卡片添加。</p>
            )}
            {deckCards.map(card => (
              <div
                key={card.id}
                className="deck-card-item in-deck"
                onClick={() => removeCard(card.id)}
                title="点击移除一张"
              >
                {card.image && (
                  <img src={card.image} alt={card.name} loading="lazy" />
                )}
                <div className="deck-card-item-info">
                  <div className="deck-card-item-name">{card.name}</div>
                  <div className="deck-card-item-meta">×{card.inDeck}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}