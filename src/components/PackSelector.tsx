// src/components/PackSelector.tsx
import { useState, useMemo } from 'react';
import type { Set } from '../types';
import setsData from '../data/sets-list.json';
import { categories } from '../data/categories';

interface Props {
  onSelect: (set: Set) => void;
  availableCodes: Set<string>;
}

export default function PackSelector({ onSelect, availableCodes }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eraFilter, setEraFilter] = useState('all');

  const filteredSets = useMemo(() => {
    return (setsData as Set[])
      .filter(set => {
        const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEra =
          eraFilter === 'all' ||
          (set.releaseDate && set.releaseDate.startsWith(eraFilter));
        return matchesSearch && matchesEra;
      })
      .sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
      });
  }, [searchTerm, eraFilter]);

  const dataCount = filteredSets.filter(s => availableCodes.has(s.code)).length;

  return (
    <div className="pack-selector">
      <div className="filters">
        <input
          type="text"
          placeholder="搜索卡包..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={eraFilter} onChange={e => setEraFilter(e.target.value)}>
          <option value="all">所有年代</option>
          {Object.entries(categories.byEra).map(([eraName, years]) => (
            <option key={eraName} value={years[0]}>
              {eraName}
            </option>
          ))}
        </select>
      </div>

      <p className="result-count">
        共 {filteredSets.length} 个卡包，其中 {dataCount} 个有卡池数据（按发售日期从新到旧排序）
      </p>

      <div className="pack-grid">
        {filteredSets.length === 0 && <p>没有找到匹配的卡包。</p>}
        {filteredSets.map((set, index) => {
          const hasData = availableCodes.has(set.code);
          return (
            <div
              key={`${set.code}-${index}`}
              className={`pack-card ${hasData ? '' : 'no-data'}`}
              onClick={() => hasData && onSelect(set)}
              title={hasData ? '点击查看卡包详情' : '此卡包暂无数据'}
            >
              {set.coverImage ? (
                <img src={set.coverImage} alt={set.name} loading="lazy" />
              ) : (
                <div className="pack-cover-placeholder">无封面</div>
              )}
              <h3>{set.name}</h3>
              <p>
                {set.cardCount} 张 • {set.releaseDate || '未知日期'}
              </p>
              {!hasData && <span className="no-data-badge">暂无数据</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}