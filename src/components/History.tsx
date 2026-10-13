// src/components/History.tsx
import { useState } from 'react';
import {
  getHistory,
  clearHistory,
  deleteHistoryEntry,
  type HistoryEntry,
} from '../lib/history';
import { useCardPreview } from './CardPreviewProvider';
import { rarityCN } from '../lib/search';
import CardImage from './CardImage';

interface Props {
  onBack: () => void;
}

export default function History({ onBack }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>(getHistory());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { openPreview } = useCardPreview();

  const handleClear = () => {
    if (confirm('确定清空所有历史记录吗？此操作不可撤销。')) {
      clearHistory();
      setEntries([]);
    }
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(getHistory());
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <button onClick={onBack} className="back-btn">← 返回</button>
        <h2>开包历史记录</h2>
        {entries.length > 0 && (
          <button onClick={handleClear} className="clear-btn">清空历史</button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="hint">还没有开包记录，去开一包试试吧！</p>
      ) : (
        <div className="history-list">
          {entries.map(entry => {
            const expanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="history-item">
                <div
                  className="history-item-header"
                  onClick={() => toggleExpand(entry.id)}
                >
                  <div className="history-item-title">
                    <h3>{entry.setName}</h3>
                    <span className="history-time">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div className="history-item-actions">
                    <span className="card-count">{entry.cards.length} 张卡</span>
                    <button
                      className="delete-btn"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      title="删除这条记录"
                    >
                      ×
                    </button>
                    <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded && (
                  <div className="history-cards">
                    {entry.cards.map((card, i) => (
                      <div
                        key={`${card.id}-${i}`}
                        className="history-card"
                        onClick={() => openPreview(card as any)}
                        title={`${card.name} - 点击放大`}
                      >
                        <CardImage card={card} />
                        <div className="history-card-name" title={card.name}>
                          {card.name}
                        </div>
                        <div className="history-card-rarity">{rarityCN(card.rarity)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}