// src/components/CardPreview.tsx
import { useEffect, useState } from 'react';
import type { CardData } from '../lib/draw';
import { RACE_CN, ATTRIBUTE_CN, getCardGroupCN, rarityCN } from '../lib/search';
import { getCardSets, type CardSetEntry } from '../lib/cardSets';
import { useCardPreview } from './CardPreviewProvider';

interface Props {
  card: CardData | null;
  onClose: () => void;
}

function safeText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const pdesc = v.pdesc || '';
    const mdesc = v.desc || '';
    if (pdesc || mdesc) {
      let out = '';
      if (pdesc) out += `【灵摆效果】\n${pdesc}`;
      if (pdesc && mdesc) out += '\n\n';
      if (mdesc) out += `【怪兽效果】\n${mdesc}`;
      return out.trim();
    }
    return '';
  }
  return String(v);
}

export default function CardPreview({ card, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [sets, setSets] = useState<CardSetEntry[] | null>(null);
  const [setsLoading, setSetsLoading] = useState(false);

  const { onNavigateToPack } = useCardPreview();

  // Esc 关闭 + 禁止背景滚动
  useEffect(() => {
    if (!card) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [card, onClose]);

  // 加载"可获取卡包"
  useEffect(() => {
    if (!card) {
      setSets(null);
      return;
    }
    setSetsLoading(true);
    getCardSets(card.id)
      .then(list => setSets(list))
      .catch(() => setSets([]))
      .finally(() => setSetsLoading(false));
  }, [card]);

  if (!card) return null;

  const handleDownload = async () => {
    setDownloading(true);
    const safeName = (card.name || 'card').replace(/[\\/:*?"<>|]/g, '_');
    try {
      const res = await fetch(card.image, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('自动下载失败：', err);
      window.open(card.image, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const c = card as CardData & {
    race?: string;
    attribute?: string;
    typeEn?: string;
    atk?: number;
    def?: number;
    level?: number;
    linkval?: number;
  };

  const raceCN = c.race ? RACE_CN[c.race] || c.race : '';
  const attrCN = c.attribute ? ATTRIBUTE_CN[c.attribute] || c.attribute : '';
  const cardTypeCN = getCardGroupCN(c);

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-content" onClick={e => e.stopPropagation()}>
        <button className="preview-close" onClick={onClose} title="关闭 (Esc)">×</button>

        <img
          src={card.image}
          alt={card.name}
          className="preview-image"
          onError={e => {
            const img = e.currentTarget;
            if (img.dataset.fb) return;
            img.dataset.fb = '1';
            img.src = `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
          }}
        />

        <div className="preview-info">
          <h3>{card.name}</h3>
          {card.nameEn && card.nameEn !== card.name && (
            <p className="preview-name-en">{card.nameEn}</p>
          )}

          <div className="preview-meta">
            <span className="preview-rarity">{rarityCN(card.rarity)}</span>
            {cardTypeCN && <span className="preview-type">{cardTypeCN}</span>}
            {attrCN && <span className="preview-attr">属性：{attrCN}</span>}
            {raceCN && <span className="preview-race">种族：{raceCN}</span>}
            {c.atk !== undefined && (
              <span className="preview-stat">
                ATK {c.atk} / DEF {c.def ?? '—'}
              </span>
            )}
            {c.level !== undefined && (
              <span className="preview-stat">等级 {c.level}</span>
            )}
            {c.linkval !== undefined && (
              <span className="preview-stat">链接 {c.linkval}</span>
            )}
          </div>

          {card.desc && <p className="preview-desc">{safeText(card.desc)}</p>}

          {(setsLoading || (sets && sets.length > 0)) && (
            <div className="preview-sets">
              <div className="preview-sets-label">
                {setsLoading
                  ? '正在查询可获取卡包...'
                  : `可获取的卡包（${sets?.length || 0}）`}
              </div>
              {sets && sets.length > 0 && (
                <div className="preview-sets-list">
                  {sets.map((s, i) => (
                    <button
                      key={`${s.code}-${s.rarity}-${i}`}
                      className="preview-set-item"
                      onClick={() => {
                        onClose();
                        onNavigateToPack?.(s.code);
                      }}
                      title={`跳转到「${s.name}」`}
                    >
                      <span className="preview-set-code">{s.code}</span>
                      <span className="preview-set-name" title={s.name}>
                        {s.name}
                      </span>
                      <span className="preview-set-rarity">
                        {rarityCN(s.rarity)}
                      </span>
                      <span className="preview-set-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="preview-actions">
            <button
              className="preview-download"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? '下载中...' : '⬇ 下载卡图'}
            </button>
            <a
              className="preview-open-original"
              href={card.image}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原图
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}