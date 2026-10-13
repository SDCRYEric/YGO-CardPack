// src/components/Collection.tsx
import { useState, useMemo } from 'react';
import { getCollection, type OwnedCard } from '../lib/collection';
import { useCardPreview } from './CardPreviewProvider';
import FilterPanel from './FilterPanel';
import {
  AdvancedFilters,
  EMPTY_FILTERS,
  matchesAdvancedFilters,
} from '../lib/advancedFilter';
import { matchCardName, rarityWeight, rarityCN } from '../lib/search';
import CardImage from './CardImage';

interface Props {
  onBack: () => void;
  onGoToDecks: () => void;
}

export default function Collection({ onBack, onGoToDecks }: Props) {
  const [cards] = useState<OwnedCard[]>(getCollection());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>({ ...EMPTY_FILTERS });
  const [sortBy, setSortBy] = useState<'rarity' | 'count' | 'name'>('rarity');
  const { openPreview } = useCardPreview();

  const totalCount = cards.reduce((sum, c) => sum + c.count, 0);
  const uniqueCount = cards.length;

  const rarities = useMemo(() => {
    const set = new Set(cards.map(c => c.rarity));
    return Array.from(set).sort((a, b) => rarityWeight(a) - rarityWeight(b));
  }, [cards]);

  const filtered = useMemo(() => {
    let list = cards.filter(c => {
      const okSearch = matchCardName(c.name, c.nameEn, searchTerm);
      const okAdvanced = matchesAdvancedFilters(c as any, filters);
      return okSearch && okAdvanced;
    });

    if (sortBy === 'count') list = [...list].sort((a, b) => b.count - a.count);
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    else list = [...list].sort((a, b) => rarityWeight(b.rarity) - rarityWeight(a.rarity));
    return list;
  }, [cards, searchTerm, filters, sortBy]);

  return (
    <div className="collection-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2>我的卡库</h2>
        <button onClick={onGoToDecks} className="primary-btn">前往卡组 →</button>
      </div>

      <div className="collection-stats">
        <div className="stat-item">
          <span className="stat-label">总卡片</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">不同种类</span>
          <span className="stat-value">{uniqueCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">筛选后</span>
          <span className="stat-value">{filtered.length}</span>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="搜索中文名或英文名..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          availableRarities={rarities}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="rarity">按稀有度</option>
          <option value="count">按数量</option>
          <option value="name">按名称</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="hint">
          {cards.length === 0 ? '卡库是空的，去开一包吧！' : '没有符合条件的卡片。'}
        </p>
      ) : (
        <div className="card-list">
          {filtered.map(card => (
            <div
              key={card.id}
              className="mini-card"
              onClick={() => openPreview(card as any)}
              title={`${card.name}${card.nameEn ? ' / ' + card.nameEn : ''}`}
            >
              {card.image ? (
                <CardImage card={card} />
              ) : (
                <div className="card-image-placeholder">?</div>
              )}
              <div className="mini-card-info">
                <div className="mini-card-name" title={card.name}>{card.name}</div>
                {card.nameEn && card.nameEn !== card.name && (
                  <div className="mini-card-name-en" title={card.nameEn}>
                    {card.nameEn}
                  </div>
                )}
                <div className="mini-card-rarity">{rarityCN(card.rarity)}</div>
              </div>
              {card.count > 1 && (
                <div className="card-count-badge">×{card.count}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}