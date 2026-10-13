// src/components/PackSelector.tsx
import { useState, useMemo } from 'react';
import type { Set } from '../types';
import setsData from '../data/sets-list.json';
import { categories } from '../data/categories';
import { matchPackName } from '../lib/search';

interface Props {
  onSelect: (set: Set) => void;
  availableCodes: Set<string>;
}

type TypeFilter = 'all' | 'booster' | 'starter' | 'structure' | 'other';

function getPackType(name: string): TypeFilter {
  const n = name.toLowerCase();
  if (n.includes('structure deck')) return 'structure';
  if (n.includes('starter deck')) return 'starter';
  if (n.includes('booster') || n.includes('pack')) return 'booster';
  return 'other';
}

export default function PackSelector({ onSelect, availableCodes }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eraFilter, setEraFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dataFilter, setDataFilter] = useState<'all' | 'has' | 'no'>('all');

  const filteredSets = useMemo(() => {
    return (setsData as Set[])
      .filter(set => {
        const okSearch = matchPackName(set.name, set.code, searchTerm);
        const okEra =
          eraFilter === 'all' ||
          (set.releaseDate && set.releaseDate.startsWith(eraFilter));
        const okType = typeFilter === 'all' || getPackType(set.name) === typeFilter;
        const hasData = availableCodes.has(set.code);
        const okData =
          dataFilter === 'all' ||
          (dataFilter === 'has' && hasData) ||
          (dataFilter === 'no' && !hasData);
        return okSearch && okEra && okType && okData;
      })
      .sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return b.releaseDate.localeCompare(a.releaseDate);
      });
  }, [searchTerm, eraFilter, typeFilter, dataFilter, availableCodes]);

  const dataCount = filteredSets.filter(s => availableCodes.has(s.code)).length;

  return (
    <div className="pack-selector">
      <div className="filters">
        <input
          type="text"
          placeholder="搜索卡包名或代码，如 LOB..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={eraFilter} onChange={e => setEraFilter(e.target.value)}>
          <option value="all">所有年代</option>
          {Object.entries(categories.byEra).map(([eraName, years]) => (
            <option key={eraName} value={years[0]}>{eraName}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)}>
          <option value="all">全部类型</option>
          <option value="booster">补充包</option>
          <option value="starter">起始卡组</option>
          <option value="structure">主题卡组</option>
          <option value="other">其他</option>
        </select>
        <select value={dataFilter} onChange={e => setDataFilter(e.target.value as any)}>
          <option value="all">全部数据</option>
          <option value="has">仅有数据</option>
          <option value="no">暂无数据</option>
        </select>
      </div>

      <p className="result-count">
        共 {filteredSets.length} 个卡包，其中 {dataCount} 个有卡池数据
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
              <p>{set.cardCount} 张 • {set.releaseDate || '未知日期'}</p>
              {!hasData && <span className="no-data-badge">暂无数据</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}