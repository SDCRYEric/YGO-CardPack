// src/App.tsx
import { useState } from 'react';
import { packs } from './data/packs';
import {
  drawFromBox,
  drawTenFromBox,
  buildVirtualBox,
  getRemainingInBox,
  type CardData,
  type CardPool,
  type VirtualBox,
} from './lib/draw';
import Card from './components/Card';
import PackSelector from './components/PackSelector';
import PackDetail from './components/PackDetail';
import History from './components/History';
import Collection from './components/Collection';
import DeckList from './components/DeckList';
import DeckBuilder from './components/DeckBuilder';
import './index.css';
import { addCardToCollection } from './lib/collection';
import { addHistoryEntry } from './lib/history';
import type { Set } from './types';

const packModules = import.meta.glob('./data/packs/*.json');
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
  | { name: 'deck-builder'; deckId: string };

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
      cards: result.map(c => ({
        id: c.id,
        name: c.name,
        image: c.image,
        rarity: c.rarity,
        type: c.type,
        desc: c.desc,
      })),
    });
  };

  const handleSelect = (set: Set) => {
    setCurrentSet(set);
    setView({ name: 'detail' });
  };

  // 首次打开：创建虚拟盒
  const handleOpenPack = (pool: CardPool) => {
    const box = buildVirtualBox(pool);
    setVirtualBox(box);
    setCurrentPool(pool);

    const result = drawFromBox(box, packs[0].cardsPerPack);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(1);
    setView({ name: 'draw' });
  };

  const handleDrawAgain = () => {
    if (!virtualBox) return;
    const result = drawFromBox(virtualBox, packs[0].cardsPerPack);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(1);
  };

  const handleDrawTen = () => {
    if (!virtualBox) return;
    const result = drawTenFromBox(virtualBox, packs[0].cardsPerPack);
    result.forEach(card => addCardToCollection(card));
    recordDraw(result);
    setCards(result);
    setLastDrawCount(10);
  };

  const backToList = () => {
    setCurrentSet(null);
    setCurrentPool(null);
    setVirtualBox(null);
    setCards([]);
    setView({ name: 'select' });
  };

  const backToDetail = () => {
    setView({ name: 'detail' });
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
        <PackDetail
          set={currentSet}
          onBack={backToList}
          onOpenPack={handleOpenPack}
        />
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
              <Card key={`${card.id}-${index}-${index}`} card={card} index={index} />
            ))}
          </div>

          <div className="actions">
            <button onClick={handleDrawAgain} disabled={isBoxEmpty}>
              再开一包
            </button>
            <button onClick={handleDrawTen} disabled={isBoxEmpty}>
              十连抽
            </button>
            {currentSet && (
              <button onClick={backToDetail}>返回卡包详情</button>
            )}
            <button onClick={() => setView({ name: 'collection' })}>前往卡库</button>
            <button onClick={backToList}>返回卡包列表</button>
          </div>
        </>
      )}

      {view.name === 'history' && (
        <History onBack={() => setView({ name: 'select' })} />
      )}

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
        <DeckBuilder
          deckId={view.deckId}
          onBack={() => setView({ name: 'decks' })}
        />
      )}
    </div>
  );
}