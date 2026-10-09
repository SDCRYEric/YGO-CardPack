// src/components/CardPreview.tsx
import { useEffect, useState } from 'react';
import type { CardData } from '../lib/draw';

interface Props {
  card: CardData | null;
  onClose: () => void;
}

export default function CardPreview({ card, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  // 按 Esc 关闭；打开时禁止背景滚动
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

  if (!card) return null;

  const handleDownload = async () => {
    setDownloading(true);
    const safeName = card.name.replace(/[\\/:*?"<>|]/g, '_');

    try {
      // 尝试用 fetch 拿到图片二进制数据
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
      // 如果因为 CORS 或网络问题失败，退回打开原图让用户手动保存
      console.warn('自动下载失败，将在新标签页打开原图：', err);
      window.open(card.image, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-content" onClick={e => e.stopPropagation()}>
        <button className="preview-close" onClick={onClose} title="关闭 (Esc)">
          ×
        </button>

        <img
          src={card.image}
          alt={card.name}
          className="preview-image"
        />

        <div className="preview-info">
          <h3>{card.name}</h3>

          <div className="preview-meta">
            <span className="preview-rarity">{card.rarity}</span>
            {card.type && <span className="preview-type">{card.type}</span>}
          </div>

          {card.desc && <p className="preview-desc">{card.desc}</p>}

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