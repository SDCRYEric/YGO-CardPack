// src/components/Announcement.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  ANNOUNCEMENT_TITLE,
  ANNOUNCEMENT_DATE,
  ANNOUNCEMENT_VERSION,
  ANNOUNCEMENT_CONTENT,
} from '../data/announcement';
import { renderMarkdown } from '../lib/markdown';

// 记录用户已读版本，避免每次打开都提醒
const READ_KEY = 'ygo-announcement-read';

interface Props {
  autoOpenIfNew?: boolean;
}

export default function Announcement({ autoOpenIfNew = false }: Props) {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  // 首次访问时自动弹出（可选）
  useEffect(() => {
    const lastRead = localStorage.getItem(READ_KEY);
    const isNew = lastRead !== ANNOUNCEMENT_VERSION;
    setHasNew(isNew);

    if (autoOpenIfNew && isNew) {
      setOpen(true);
    }
  }, [autoOpenIfNew]);

  const handleOpen = () => {
    setOpen(true);
    localStorage.setItem(READ_KEY, ANNOUNCEMENT_VERSION);
    setHasNew(false);
  };

  const handleClose = () => setOpen(false);

  const html = useMemo(() => renderMarkdown(ANNOUNCEMENT_CONTENT), []);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        className={`nav-btn ${hasNew ? 'has-badge' : ''}`}
        onClick={handleOpen}
        title={hasNew ? '有新公告' : '查看公告'}
      >
        📢 公告
        {hasNew && <span className="nav-badge" />}
      </button>

      {open && (
        <div className="announcement-overlay" onClick={handleClose}>
          <div className="announcement-modal" onClick={e => e.stopPropagation()}>
            <div className="announcement-header">
              <div className="announcement-title-block">
                <h2>📢 {ANNOUNCEMENT_TITLE}</h2>
                <div className="announcement-meta">
                  <span className="announcement-version">{ANNOUNCEMENT_VERSION}</span>
                  <span className="announcement-date">{ANNOUNCEMENT_DATE}</span>
                </div>
              </div>
              <button className="announcement-close" onClick={handleClose} title="关闭 (Esc)">
                ×
              </button>
            </div>

            <div
              className="announcement-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="announcement-footer">
              <button className="announcement-close-btn" onClick={handleClose}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}