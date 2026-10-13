// src/App.tsx
import { useState } from 'react';
import { packs } from './data/packs';
import {
  drawFromBox,
  drawTenFromBox,
  buildVirtualBox,
  resolvePool,
  getRemainingInBox,
  type CardData,
  type CardPool,
  type CardPoolIndex,
  type VirtualBox,
  restoreBoxFromState,
  isBoxDried,
} from './lib/draw';
import { loadCardsDb } from './lib/cardsDb';
import Card from './components/Card';
import PackSelector from './components/PackSelector';
import PackDetail from './components/PackDetail';
import History from './components/History';
import Collection from './components/Collection';
import DeckList from './components/DeckList';
import DeckBuilder from './components/DeckBuilder';
import CardSearch from './components/CardSearch';
import './index.css';
import { addCardToCollection } from './lib/collection';
import { addHistoryEntry } from './lib/history';
import type { Set } from './types';
import { getBoxState, saveBoxState, clearBoxState } from './lib/boxes';

const packModules = import.meta.glob('./data/packs-cn/*.json');
const availableCodes = new Set(
  Object.keys(packModules).map(p => {
    const m = p.match(/\/([^/]+)\.json$/);
    return m ? m[1] : '';
  })
);

type View =
  | { name: 'select' }
  | { name: 'detail' }
  | { name: 'draw' }
  | { name: 'history' }
  | { name: 'collection' }
  | { name: 'decks' }
  | { name: 'deck-builder'; deckId: string }
  | { name: 'card-search' };

export default function App() {
  const [view, setView] = useState<View>({ name: 'select' });
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentSet, setCurrentSet] = useState<Set | null>(null);
  const [currentPool, setCurrentPool] = useState<CardPool | null>(null);
  const [virtualBox, setVirtualBox] = useState<VirtualBox | null>(null);
  const [lastDrawCount, setLastDrawCount] = useState(1);

  const recordDraw = (result: CardData[]) => {
    if (!currentSet) return;
    addHistoryEntry({
      setId: currentSet.code,
      setName: currentSet.name,
      cards: result.map(c => {
        const card = c as CardData & {
          race?: string; attribute?: string; typeEn?: string;
          atk?: number; def?: number; level?: number; linkval?: number;
        };
        return {
          id: card.id,
          name: card.name,
          image: card.image,
          rarity: card.rarity,
          type: card.type,
          typeEn: card.typeEn,
          race: card.race,
          attribute: card.attribute,
          atk: card.atk,
          def: card.def,
          level: card.level,
          linkval: card.linkval,
          desc: card.desc,
        };
      }),
    });
  };

  const handleSelect = (set: Set) => {
    setCurrentSet(set);
    setView({ name: 'detail' });
  };

  // 现在 onOpenPack 接收的是 CardPoolIndex，内部异步解析
  const handleOpenPack = async (poolIndex: CardPoolIndex) => {
    if (!currentSet) return;
    const db = await loadCardsDb();
    const pool = resolvePool(poolIndex, db);
    setCurrentPool(pool);

    // 检查是否有已存在的盒
    const existing = getBoxState(currentSet.code);
    let box: VirtualBox;

    if (existing) {
      box = restoreBoxFromState(existing, db);
    } else {
      box = buildVirtualBox(pool);
      saveBoxState(currentSet.code, box);
    }

    setVirtualBox(box);

    if (isBoxDried(box)) {
      // 盒已抽干，不抽卡，只显示状态
      setCards([]);
      setView({ name: 'draw' });
      return;
    }

    const result = drawFromBox(box, packs[0].cardsPerPack);
    saveBoxState(currentSet.code, box);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(1);
    setView({ name: 'draw' });
  };

  const handleDrawAgain = () => {
    if (!virtualBox || !currentSet) return;
    const result = drawFromBox(virtualBox, packs[0].cardsPerPack);
    saveBoxState(currentSet.code, virtualBox);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(1);
  };

  // 修改 handleDrawTen
  const handleDrawTen = () => {
    if (!virtualBox || !currentSet) return;
    const result = drawTenFromBox(virtualBox, packs[0].cardsPerPack);
    saveBoxState(currentSet.code, virtualBox);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(10);
  };

  const handleResetBox = () => {
    if (!currentSet || !currentPool) return;
    if (!confirm('确定重置这个卡盒吗？抽过的卡不会消失，但盒中的剩余卡会重新洗牌。')) return;
    clearBoxState(currentSet.code);
    const newBox = buildVirtualBox(currentPool);
    saveBoxState(currentSet.code, newBox);
    setVirtualBox(newBox);
    setCards([]);
  };

  const backToList = () => {
    setCurrentSet(null);
    setCurrentPool(null);
    setVirtualBox(null);
    setCards([]);
    setView({ name: 'select' });
  };

  const remainingPacks =
    virtualBox ? getRemainingInBox(virtualBox, packs[0].cardsPerPack) : 0;
  const isBoxEmpty = virtualBox ? virtualBox.cards.length === 0 : false;

  return (
    <div className="app">
      <h1>游戏王开包模拟器</h1>

      {view.name === 'select' && (
        <>
          <div className="top-nav">
            <button className="nav-btn" onClick={() => setView({ name: 'card-search' })}>
              🔍 卡牌搜索
            </button>
            <button className="nav-btn" onClick={() => setView({ name: 'collection' })}>
              📚 我的卡库
            </button>
            <button className="nav-btn" onClick={() => setView({ name: 'decks' })}>
              🎴 我的卡组
            </button>
            <button className="nav-btn" onClick={() => setView({ name: 'history' })}>
              📜 开包历史
            </button>
          </div>
          <PackSelector onSelect={handleSelect} availableCodes={availableCodes} />
        </>
      )}

      {view.name === 'detail' && currentSet && (
        <PackDetail set={currentSet} onBack={backToList} onOpenPack={handleOpenPack} />
      )}

      {view.name === 'draw' && (
        <>
          {virtualBox && (
            <div className="box-status">
              <span>剩余 {remainingPacks} 包</span>
              <span className="box-status-dot">·</span>
              <span>已抽 {virtualBox.drawnCount} 张</span>
              {isBoxEmpty && <span className="box-empty">卡盒已抽干</span>}
            </div>
          )}

          <div className={`card-grid ${lastDrawCount === 10 ? 'compact' : ''}`}>
            {cards.map((card, index) => (
              <Card key={`${card.id}-${index}`} card={card} index={index} />
            ))}
          </div>

          <div className="actions">
            <button onClick={handleDrawAgain} disabled={isBoxEmpty}>再开一包</button>
            <button onClick={handleDrawTen} disabled={isBoxEmpty}>十连抽</button>
            {isBoxEmpty && (
              <button onClick={handleResetBox} className="reset-btn">重置卡盒</button>
            )}
            {currentSet && (
              <button onClick={() => setView({ name: 'detail' })}>返回卡包详情</button>
            )}
            <button onClick={() => setView({ name: 'collection' })}>前往卡库</button>
            <button onClick={backToList}>返回卡包列表</button>
          </div>
        </>
      )}

      {view.name === 'history' && <History onBack={() => setView({ name: 'select' })} />}

      {view.name === 'collection' && (
        <Collection
          onBack={() => setView({ name: 'select' })}
          onGoToDecks={() => setView({ name: 'decks' })}
        />
      )}

      {view.name === 'decks' && (
        <DeckList
          onBack={() => setView({ name: 'select' })}
          onEditDeck={deckId => setView({ name: 'deck-builder', deckId })}
        />
      )}

      {view.name === 'deck-builder' && (
        <DeckBuilder deckId={view.deckId} onBack={() => setView({ name: 'decks' })} />
      )}

      {view.name === 'card-search' && (
        <CardSearch onBack={() => setView({ name: 'select' })} />
      )}
    </div>
  );
}