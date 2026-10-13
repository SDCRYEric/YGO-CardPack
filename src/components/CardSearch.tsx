// src/components/CardSearch.tsx
import { useEffect, useMemo, useState } from 'react';
import type { CardData } from '../lib/draw';
import { loadCardsDb, type CardsDb } from '../lib/cardsDb';
import { useCardPreview } from './CardPreviewProvider';
import FilterPanel from './FilterPanel';
import {
  AdvancedFilters,
  EMPTY_FILTERS,
  matchesAdvancedFilters,
} from '../lib/advancedFilter';
import { matchCardName } from '../lib/search';
import CardImage from './CardImage';

interface Props {
  onBack: () => void;
}

export default function CardSearch({ onBack }: Props) {
  const [db, setDb] = useState<CardsDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>({ ...EMPTY_FILTERS });
  const [visibleCount, setVisibleCount] = useState(60);

  const { openPreview } = useCardPreview();

  useEffect(() => {
    loadCardsDb().then(data => {
      setDb(data);
      setLoading(false);
    });
  }, []);

  const allCards = useMemo<CardData[]>(() => {
    if (!db) return [];
    return Object.values(db).map(info => ({ ...info, rarity: '—' }));
  }, [db]);

  const filtered = useMemo(() => {
    let list = allCards.filter(card => {
      const okSearch = matchCardName(card.name, card.nameEn, search);
      const okAdvanced = matchesAdvancedFilters(card as any, { ...filters, rarities: [] });
      return okSearch && okAdvanced;
    });
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    return list;
  }, [allCards, search, filters]);

  useEffect(() => {
    setVisibleCount(60);
  }, [search, filters]);

  return (
    <div className="card-search-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2>卡牌搜索</h2>
        {!loading && (
          <span className="panel-count">共 {allCards.length} 种卡牌</span>
        )}
      </div>

      {loading ? (
        <div className="loading-box"><p>正在加载卡片库...</p></div>
      ) : (
        <>
          <div className="filters">
            <input
              type="text"
              placeholder="输入中文名或英文名，如「青眼」或「Blue-Eyes」"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              hideRarity
            />
          </div>

          <p className="result-count">
            找到 {filtered.length} 张卡牌
            {filtered.length > visibleCount && `（显示前 ${visibleCount} 张）`}
          </p>

          {filtered.length === 0 && (
            <p className="hint">没有匹配的卡牌，试试换个关键词。</p>
          )}

          <div className="card-list">
            {filtered.slice(0, visibleCount).map(card => (
              <div
                key={card.id}
                className="mini-card"
                onClick={() => openPreview(card)}
                title={`${card.name}${card.nameEn ? ' / ' + card.nameEn : ''}`}
              >
                <CardImage card={card} />
                <div className="mini-card-info">
                  <div className="mini-card-name" title={card.name}>{card.name}</div>
                  {card.nameEn && card.nameEn !== card.name && (
                    <div className="mini-card-name-en" title={card.nameEn}>
                      {card.nameEn}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length > visibleCount && (
            <button
              className="load-more-btn"
              onClick={() => setVisibleCount(v => v + 60)}
            >
              加载更多（剩余 {filtered.length - visibleCount} 张）
            </button>
          )}
        </>
      )}
    </div>
  );
}