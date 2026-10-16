// src/components/UpdateChecker.tsx
import { useState } from 'react';
import setsData from '../data/sets-list.json';
import { checkDataUpdate, type UpdateCheckResult } from '../lib/updateChecker';

const LAST_CHECK_KEY = 'ygo-last-update-check';

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

export default function UpdateChecker() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setOpen(true);
    const r = await checkDataUpdate(setsData as any);
    setResult(r);
    setLoading(false);
    localStorage.setItem(LAST_CHECK_KEY, String(r.checkedAt));
  };

  const lastCheckText = (() => {
    const raw = localStorage.getItem(LAST_CHECK_KEY);
    if (!raw) return '从未检查';
    return formatRelativeTime(Number(raw));
  })();

  return (
    <>
      <button className="nav-btn" onClick={handleCheck} disabled={loading}>
        {loading ? '🔄 检查中...' : '🔄 检查更新'}
      </button>

      {open && (
        <div
          className="update-overlay"
          onClick={() => !loading && setOpen(false)}
        >
          <div className="update-modal" onClick={e => e.stopPropagation()}>
            <div className="update-header">
              <h3>数据更新检查</h3>
              <button
                className="update-close"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            {loading && (
              <div className="update-loading">
                <div className="update-spinner" />
                <p>正在连接 YGOPRODeck...</p>
              </div>
            )}

            {!loading && result && (
              <>
                {result.error ? (
                  <div className="update-block error">
                    <p className="update-title">❌ 检查失败</p>
                    <p className="update-msg">{result.error}</p>
                    <p className="hint">请检查网络连接后重试</p>
                  </div>
                ) : result.hasUpdate ? (
                  <div className="update-block has-update">
                    <p className="update-title">🎉 发现新数据</p>

                    <div className="update-stats">
                      <div className="update-stat">
                        <span className="update-stat-label">本地卡包</span>
                        <span className="update-stat-value">{result.localCount}</span>
                      </div>
                      <div className="update-stat">
                        <span className="update-stat-label">线上卡包</span>
                        <span className="update-stat-value">{result.remoteCount}</span>
                      </div>
                      <div className="update-stat highlight">
                        <span className="update-stat-label">新增</span>
                        <span className="update-stat-value">+{result.newCodes.length}</span>
                      </div>
                    </div>

                    <div className="update-code-section">
                      <p className="update-code-label">
                        新增卡包代码（前 20 个）：
                      </p>
                      <div className="update-code-list">
                        {result.newCodes.slice(0, 20).map(c => (
                          <span key={c} className="update-code-chip">{c}</span>
                        ))}
                        {result.newCodes.length > 20 && (
                          <span className="update-code-chip muted">
                            ... +{result.newCodes.length - 20}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="update-instructions">
                      <p className="update-instructions-title">如何在本地更新数据：</p>
                      <ol>
                        <li>打开终端，进入项目目录</li>
                        <li>运行 <code>node scripts/fetch-set-list.mjs</code></li>
                        <li>运行 <code>node scripts/fetch-cn-data.mjs</code></li>
                        <li>运行 <code>node scripts/build-card-index.mjs</code></li>
                        <li>提交并推送到 GitHub，网站会自动部署</li>
                      </ol>
                      <p className="hint">
                        受浏览器安全限制，纯前端无法直接更新数据文件
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="update-block up-to-date">
                    <p className="update-title">✅ 数据已是最新</p>
                    <div className="update-stats">
                      <div className="update-stat">
                        <span className="update-stat-label">本地卡包</span>
                        <span className="update-stat-value">{result.localCount}</span>
                      </div>
                      <div className="update-stat">
                        <span className="update-stat-label">线上卡包</span>
                        <span className="update-stat-value">{result.remoteCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="update-footer">
              <span className="update-last-check">
                上次检查：{lastCheckText}
              </span>
              <button
                className="update-close-btn"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}