// src/components/DeckList.tsx
import { useState } from 'react';
import { getDecks, deleteDeck, createDeck, saveDeck, DECK_RULES, type Deck } from '../lib/deck';

interface Props {
  onBack: () => void;
  onEditDeck: (deckId: string) => void;
}

export default function DeckList({ onBack, onEditDeck }: Props) {
  const [decks, setDecks] = useState<Deck[]>(getDecks());

  const handleCreate = () => {
    const name = prompt('请输入卡组名称：', '新卡组');
    if (name === null) return;
    const deck = createDeck(name);
    saveDeck(deck);
    setDecks(getDecks());
    onEditDeck(deck.id);
  };

  const handleDelete = (deck: Deck) => {
    if (confirm(`确定删除卡组「${deck.name}」吗？`)) {
      deleteDeck(deck.id);
      setDecks(getDecks());
    }
  };

  const deckSize = (deck: Deck) =>
    Object.values(deck.main).reduce((s, n) => s + n, 0);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="deck-list-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2>我的卡组</h2>
        <button onClick={handleCreate} className="primary-btn">+ 新建卡组</button>
      </div>

      {decks.length === 0 ? (
        <p className="hint">还没有卡组，点击“新建卡组”开始吧！</p>
      ) : (
        <div className="deck-grid">
          {decks.map(deck => {
            const size = deckSize(deck);
            const valid =
              size >= DECK_RULES.MIN_MAIN && size <= DECK_RULES.MAX_MAIN;
            const statusText = valid
              ? '✓ 合法'
              : size === 0
              ? '空'
              : size < DECK_RULES.MIN_MAIN
              ? `不足 ${DECK_RULES.MIN_MAIN}`
              : `超过 ${DECK_RULES.MAX_MAIN}`;
            return (
              <div key={deck.id} className="deck-card">
                <div className="deck-card-info" onClick={() => onEditDeck(deck.id)}>
                  <h3>{deck.name}</h3>
                  <p className="deck-size">
                    {size} 张
                    <span className={`deck-status ${valid ? 'valid' : 'invalid'}`}>
                      {statusText}
                    </span>
                  </p>
                  <p className="deck-time">更新于 {formatTime(deck.updatedAt)}</p>
                </div>
                <div className="deck-card-actions">
                  <button onClick={() => onEditDeck(deck.id)}>编辑</button>
                  <button onClick={() => handleDelete(deck)} className="danger-btn">
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}