// src/components/Collection.tsx
import { useState, useMemo } from 'react';
import { getCollection, type OwnedCard } from '../lib/collection';
import { useCardPreview } from './CardPreviewProvider';

interface Props {
  onBack: () => void;
  onGoToDecks: () => void;
}

const RARITY_ORDER = [
  'Common', 'Short Print', 'Rare', 'Super Rare', 'Ultra Rare',
  'Secret Rare', 'Ultimate Rare', 'Ghost Rare', 'Starlight Rare',
  'Quarter Century Secret Rare', "Collector's Rare",
];

export default function Collection({ onBack, onGoToDecks }: Props) {
  const [cards] = useState<OwnedCard[]>(getCollection());
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'count' | 'name'>('rarity');
  const { openPreview } = useCardPreview();

  const totalCount = cards.reduce((sum, c) => sum + c.count, 0);
  const uniqueCount = cards.length;

  const rarities = useMemo(() => {
    const set = new Set(cards.map(c => c.rarity));
    return Array.from(set).sort((a, b) => {
      const ai = RARITY_ORDER.indexOf(a);
      const bi = RARITY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [cards]);

  const filtered = useMemo(() => {
    let list = cards.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });

    if (sortBy === 'count') {
      list = [...list].sort((a, b) => b.count - a.count);
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => {
        const ai = RARITY_ORDER.indexOf(a.rarity);
        const bi = RARITY_ORDER.indexOf(b.rarity);
        return (bi === -1 ? 999 : bi) - (ai === -1 ? 999 : ai);
      });
    }
    return list;
  }, [cards, searchTerm, rarityFilter, sortBy]);

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
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="搜索卡名..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
          <option value="all">所有稀有度</option>
          {rarities.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
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
              title={`${card.name} - 点击放大`}
            >
              {card.image ? (
                <img src={card.image} alt={card.name} loading="lazy" />
              ) : (
                <div className="card-image-placeholder">?</div>
              )}
              <div className="mini-card-info">
                <div className="mini-card-name" title={card.name}>{card.name}</div>
                <div className="mini-card-rarity">{card.rarity}</div>
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