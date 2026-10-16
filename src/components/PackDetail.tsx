// src/components/PackDetail.tsx
import { useState, useEffect } from 'react';
import type { Set } from '../types';
import {
  resolvePool,
  type CardPool,
  type CardPoolIndex,
} from '../lib/draw';
import { loadCardsDb } from '../lib/cardsDb';
import { getGeneration, getMasterRule } from '../data/categories';
import { useCardPreview } from './CardPreviewProvider';
import { getBoxState, clearBoxState } from '../lib/boxes';
import { rarityCN } from '../lib/search';
import { CARDS_PER_PACK } from '../data/packs';

interface Props {
  set: Set;
  onBack: () => void;
  onOpenPack: (poolIndex: CardPoolIndex) => void;
  backLabel?: string;
}

export default function PackDetail({ set, onBack, onOpenPack, backLabel }: Props) {
  const [pool, setPool] = useState<CardPool | null>(null);
  const [poolIndex, setPoolIndex] = useState<CardPoolIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openPreview } = useCardPreview();
  const [boxInfo, setBoxInfo] = useState<{
    remaining: number;
    drawn: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPool(null);
    setPoolIndex(null);

    Promise.all([
      import(`../data/packs-cn/${set.code}.json`),
      loadCardsDb(),
    ])
      .then(([packMod, db]) => {
        const index = (packMod as any).default.pool as CardPoolIndex;
        const resolved = resolvePool(index, db);
        setPool(resolved);
        setPoolIndex(index);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(
          `这个卡包的详细卡池数据还未生成。你需要先为「${set.code}」生成 src/data/packs-cn/${set.code}.json 文件。`
        );
        setLoading(false);
      });
  }, [set.code]);

  useEffect(() => {
    if (!pool || !set) return;
    const existing = getBoxState(set.code);
    if (existing) {
      setBoxInfo({
        remaining: existing.cardIds.length,
        drawn: existing.drawnCount,
        total: existing.totalCards,
      });
    } else {
      setBoxInfo(null);
    }
  }, [pool, set]);

  const handleReset = () => {
    if (!set) return;
    if (!confirm('确定重置这个卡盒吗？抽过的卡不会消失，但盒中的剩余卡会重新洗牌。')) return;
    clearBoxState(set.code);
    setBoxInfo(null);
  };

  const allCards = pool
    ? Object.entries(pool).flatMap(([rarity, cards]) =>
        cards.map(card => ({ ...card, rarity }))
      )
    : [];

  // ========== 新增：计算包数和"是否抽过" ==========
  const totalPacks = boxInfo
    ? Math.ceil(boxInfo.total / CARDS_PER_PACK)
    : 0;
  const remainingPacks = boxInfo
    ? Math.ceil(boxInfo.remaining / CARDS_PER_PACK)
    : 0;
  // 抽过才显示重置按钮（全新未抽的盒不需要重置）
  const hasDrawn = boxInfo ? boxInfo.remaining < boxInfo.total : false;

  return (
    <div className="pack-detail">
      <button onClick={onBack} className="back-btn">
        ← {backLabel || '返回卡包列表'}
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

          {poolIndex && (
            <div className="box-info-panel">
              {boxInfo ? (
                <>
                  <div className="box-info-text">
                    <span>
                      剩余 <strong>{remainingPacks}</strong> / {totalPacks} 包
                    </span>
                    <span>·</span>
                    <span>已抽 {boxInfo.drawn} 张</span>
                    {boxInfo.remaining === 0 && (
                      <span className="box-empty">已抽干</span>
                    )}
                  </div>
                  <div className="box-info-actions">
                    <button
                      className="open-pack-btn"
                      onClick={() => onOpenPack(poolIndex)}
                    >
                      {boxInfo.remaining === 0 ? '进入抽卡页' : '继续抽卡'}
                    </button>
                    {/* 【关键】只有抽过才显示重置按钮 */}
                    {hasDrawn && (
                      <button className="reset-btn" onClick={handleReset}>
                        重置卡盒
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  className="open-pack-btn"
                  onClick={() => onOpenPack(poolIndex)}
                >
                  打开这包（新建卡盒）
                </button>
              )}
            </div>
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
                <img
                  src={card.image}
                  alt={card.name}
                  loading="lazy"
                  onError={e => {
                    const img = e.currentTarget;
                    if (img.dataset.fb) return;
                    img.dataset.fb = '1';
                    img.src = `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
                  }}
                />
                <div className="mini-card-info">
                  <div className="mini-card-name" title={card.name}>
                    {card.name}
                  </div>
                  {card.nameEn && card.nameEn !== card.name && (
                    <div className="mini-card-name-en" title={card.nameEn}>
                      {card.nameEn}
                    </div>
                  )}
                  <div className="mini-card-rarity">{rarityCN(card.rarity)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}