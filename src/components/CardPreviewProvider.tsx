// src/components/CardPreviewProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CardData } from '../lib/draw';
import CardPreview from './CardPreview';

interface ContextValue {
  openPreview: (card: CardData) => void;
}

const CardPreviewContext = createContext<ContextValue | null>(null);

export function useCardPreview() {
  const ctx = useContext(CardPreviewContext);
  if (!ctx) throw new Error('useCardPreview 必须在 CardPreviewProvider 内部使用');
  return ctx;
}

export function CardPreviewProvider({ children }: { children: ReactNode }) {
  const [card, setCard] = useState<CardData | null>(null);

  const openPreview = useCallback((c: CardData) => setCard(c), []);
  const closePreview = useCallback(() => setCard(null), []);

  const value = useMemo(() => ({ openPreview }), [openPreview]);

  return (
    <CardPreviewContext.Provider value={value}>
      {children}
      <CardPreview card={card} onClose={closePreview} />
    </CardPreviewContext.Provider>
  );
}