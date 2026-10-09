// src/components/PackDetail.tsx
import { useState, useEffect } from 'react';
import type { Set } from '../types';
import type { CardPool } from '../lib/draw';
import { getGeneration, getMasterRule } from '../data/categories';
import { useCardPreview } from './CardPreviewProvider';

interface Props {
  set: Set;
  onBack: () => void;
  onOpenPack: (pool: CardPool) => void;
}

export default function PackDetail({ set, onBack, onOpenPack }: Props) {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openPreview } = useCardPreview();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPool(null);

    import(`../data/packs/${set.code}.json`)
      .then(mod => {
        setPool(mod.default.pool as CardPool);
        setLoading(false);
      })
      .catch(() => {
        setError(
          `这个卡包的详细卡池数据还未生成。你需要先为「${set.code}」生成 src/data/packs/${set.code}.json 文件。`
        );
        setLoading(false);
      });
  }, [set.code]);

  const allCards = pool
    ? Object.entries(pool).flatMap(([rarity, cards]) =>
        cards.map(card => ({ ...card, rarity }))
      )
    : [];

  return (
    <div className="pack-detail">
      <button onClick={onBack} className="back-btn">
        ← 返回卡包列表
      </button>

      <div className="pack-header">
        {set.coverImage ? (
          <img src={set.coverImage} alt={set.name} className="pack-cover-large" />
        ) : (
          <div className="pack-cover-large placeholder">无封面</div>
        )}

        <div className="pack-info">
          <h1>{set.name}</h1>
          <div className="pack-meta">
            <div>
              <span className="label">卡包代码：</span>
              <span>{set.code}</span>
            </div>
            <div>
              <span className="label">发售年份：</span>
              <span>{set.releaseDate || '未知'}</span>
            </div>
            <div>
              <span className="label">卡片数量：</span>
              <span>{set.cardCount} 张</span>
            </div>
            <div>
              <span className="label">所属世代：</span>
              <span className="highlight">{getGeneration(set.releaseDate)}</span>
            </div>
            <div>
              <span className="label">适用规则：</span>
              <span className="highlight">{getMasterRule(set.releaseDate)}</span>
            </div>
          </div>

          {pool && (
            <button
              className="open-pack-btn"
              onClick={() => onOpenPack(pool)}
            >
              打开这包
            </button>
          )}
        </div>
      </div>

      <div className="pack-cards-section">
        <h2>卡包内容</h2>

        {loading && <p className="hint">正在加载卡片数据...</p>}
        {error && <p className="error-msg">{error}</p>}
        {!loading && !error && allCards.length === 0 && (
          <p className="hint">此卡包暂无卡片数据。</p>
        )}

        {!loading && !error && allCards.length > 0 && (
          <div className="card-list">
            {allCards.map(card => (
              <div
                  key={card.id}
                  className="mini-card"
                  onClick={() => openPreview(card)}
                  title={`${card.name} - 点击放大`}
              >
              <img src={card.image} alt={card.name} loading="lazy" />
              <div className="mini-card-info">
              <div className="mini-card-name" title={card.name}>
                {card.name}
              </div>
                <div className="mini-card-rarity">{card.rarity}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}