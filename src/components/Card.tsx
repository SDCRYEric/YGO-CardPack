// src/components/Card.tsx
import { useState } from 'react';
import type { CardData } from '../lib/draw';
import { useCardPreview } from './CardPreviewProvider';
import { rarityCN } from '../lib/search';
import CardImage from './CardImage';

interface Props {
  card: CardData;
  index: number;
}

export default function Card({ card, index }: Props) {
  const [flipped, setFlipped] = useState(false);
  const { openPreview } = useCardPreview();

  const handleClick = () => {
    if (!flipped) {
      setFlipped(true);
    } else {
      openPreview(card);
    }
  };

  return (
    <div
      className={`card ${flipped ? 'flipped' : ''}`}
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.12}s` }}
      title={flipped ? '点击放大预览' : '点击翻牌'}
    >
      <div className="card-inner">
        <div className="card-back">YGO</div>
        <div className="card-front">
          <CardImage card={card} className="card-image" />
          <div className="rarity">{rarityCN(card.rarity)}</div>
        </div>
      </div>
    </div>
  );
}