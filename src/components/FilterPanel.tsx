// src/components/FilterPanel.tsx
import { useState } from 'react';
import {
  AdvancedFilters,
  EMPTY_FILTERS,
  countActiveFilters,
} from '../lib/advancedFilter';
import { RACE_CN, ATTRIBUTE_CN, rarityCN, RARITY_ORDER } from '../lib/search';

interface Props {
  filters: AdvancedFilters;
  onChange: (f: AdvancedFilters) => void;
  availableRarities?: string[];
  hideRarity?: boolean;
}

type TabKey = 'monster' | 'spell-trap';

const MONSTER_RACES = [
  'Dragon', 'Zombie', 'Fiend', 'Pyro', 'Sea Serpent', 'Rock',
  'Machine', 'Fish', 'Dinosaur', 'Insect', 'Beast', 'Beast-Warrior',
  'Plant', 'Aqua', 'Warrior', 'Winged Beast', 'Fairy', 'Spellcaster',
  'Thunder', 'Reptile', 'Psychic', 'Wyrm', 'Cyberse', 'Illusion',
  'Divine-Beast', 'Creator God',
];

export default function FilterPanel({ filters, onChange, availableRarities, hideRarity }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('monster');

  const activeCount = countActiveFilters(filters);
  const update = (patch: Partial<AdvancedFilters>) => onChange({ ...filters, ...patch });

  const toggleArray = (key: keyof AdvancedFilters, value: any) => {
    const arr = (filters[key] as any[]) || [];
    if (arr.includes(value)) {
      update({ [key]: arr.filter(v => v !== value) } as any);
    } else {
      update({ [key]: [...arr, value] } as any);
    }
  };

  const rarities = availableRarities
    ? [...availableRarities].sort(
        (a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b)
      )
    : RARITY_ORDER;

  return (
    <>
      <button
        className={`filter-trigger ${activeCount > 0 ? 'active' : ''}`}
        onClick={() => setOpen(true)}
      >
        ⚙ 筛选{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {open && (
        <div className="filter-overlay" onClick={() => setOpen(false)}>
          <div className="filter-modal" onClick={e => e.stopPropagation()}>
            <div className="filter-header">
              <h3>详细筛选</h3>
              <button className="filter-close" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="filter-section">
              <div className="filter-label">卡片类别</div>
              <div className="filter-chips">
                {[
                  { v: 'monster', t: '怪兽' },
                  { v: 'spell', t: '魔法' },
                  { v: 'trap', t: '陷阱' },
                  { v: 'extra', t: '额外怪兽' },
                ].map(o => (
                  <button
                    key={o.v}
                    className={filters.groups.includes(o.v) ? 'on' : ''}
                    onClick={() => toggleArray('groups', o.v)}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-tabs">
              <button className={tab === 'monster' ? 'on' : ''} onClick={() => setTab('monster')}>
                怪兽
              </button>
              <button className={tab === 'spell-trap' ? 'on' : ''} onClick={() => setTab('spell-trap')}>
                魔法 / 陷阱
              </button>
            </div>

            {tab === 'monster' && (
              <>
                <div className="filter-section">
                  <div className="filter-label">卡片种类</div>
                  <div className="filter-chips">
                    {[
                      { v: 'normal', t: '通常' },
                      { v: 'effect', t: '效果' },
                      { v: 'ritual', t: '仪式' },
                      { v: 'fusion', t: '融合' },
                      { v: 'synchro', t: '同调' },
                      { v: 'xyz', t: '超量' },
                      { v: 'pendulum', t: '灵摆' },
                      { v: 'link', t: '连接' },
                    ].map(o => (
                      <button
                        key={o.v}
                        className={filters.monsterKinds.includes(o.v) ? 'on' : ''}
                        onClick={() => toggleArray('monsterKinds', o.v)}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">属性</div>
                  <div className="filter-chips">
                    {Object.entries(ATTRIBUTE_CN).map(([v, t]) => (
                      <button
                        key={v}
                        className={filters.attributes.includes(v) ? 'on' : ''}
                        onClick={() => toggleArray('attributes', v)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">种族</div>
                  <div className="filter-chips">
                    {MONSTER_RACES.map(v => (
                      <button
                        key={v}
                        className={filters.races.includes(v) ? 'on' : ''}
                        onClick={() => toggleArray('races', v)}
                      >
                        {RACE_CN[v] || v}族
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">等级 / 阶级 / 连接</div>
                  <div className="filter-chips">
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => (
                      <button
                        key={n}
                        className={filters.levels.includes(n) ? 'on' : ''}
                        onClick={() => toggleArray('levels', n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">攻击力</div>
                  <div className="filter-range">
                    <input
                      type="number"
                      placeholder="最小"
                      value={filters.atkMin ?? ''}
                      onChange={e => update({ atkMin: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <span>~</span>
                    <input
                      type="number"
                      placeholder="最大"
                      value={filters.atkMax ?? ''}
                      onChange={e => update({ atkMax: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <label className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={!!filters.unknownAtk}
                        onChange={e => update({ unknownAtk: e.target.checked })}
                      />
                      攻击力 "?"
                    </label>
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">守备力</div>
                  <div className="filter-range">
                    <input
                      type="number"
                      placeholder="最小"
                      value={filters.defMin ?? ''}
                      onChange={e => update({ defMin: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <span>~</span>
                    <input
                      type="number"
                      placeholder="最大"
                      value={filters.defMax ?? ''}
                      onChange={e => update({ defMax: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </>
            )}

            {tab === 'spell-trap' && (
              <>
                <div className="filter-section">
                  <div className="filter-label">魔法</div>
                  <div className="filter-chips">
                    {[
                      { v: 'normal', t: '通常' },
                      { v: 'continuous', t: '永续' },
                      { v: 'equip', t: '装备' },
                      { v: 'quick', t: '速攻' },
                      { v: 'ritual', t: '仪式' },
                      { v: 'field', t: '场地' },
                    ].map(o => (
                      <button
                        key={o.v}
                        className={filters.spellKinds.includes(o.v) ? 'on' : ''}
                        onClick={() => toggleArray('spellKinds', o.v)}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-label">陷阱</div>
                  <div className="filter-chips">
                    {[
                      { v: 'normal', t: '通常' },
                      { v: 'continuous', t: '永续' },
                      { v: 'counter', t: '反击' },
                    ].map(o => (
                      <button
                        key={o.v}
                        className={filters.trapKinds.includes(o.v) ? 'on' : ''}
                        onClick={() => toggleArray('trapKinds', o.v)}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!hideRarity && (
              <div className="filter-section">
                <div className="filter-label">稀有度</div>
                <div className="filter-chips">
                  {rarities.map(r => (
                    <button
                      key={r}
                      className={filters.rarities.includes(r) ? 'on' : ''}
                      onClick={() => toggleArray('rarities', r)}
                    >
                      {rarityCN(r)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="filter-footer">
              <button className="filter-reset" onClick={() => onChange({ ...EMPTY_FILTERS })}>
                清空条件
              </button>
              <button className="filter-apply" onClick={() => setOpen(false)}>完成</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}