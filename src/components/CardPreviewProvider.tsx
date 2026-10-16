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
  onNavigateToPack?: (setCode: string) => void;
}

const CardPreviewContext = createContext<ContextValue | null>(null);

export function useCardPreview() {
  const ctx = useContext(CardPreviewContext);
  if (!ctx) throw new Error('useCardPreview 必须在 CardPreviewProvider 内部使用');
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
  onNavigateToPack?: (setCode: string) => void;
}

export function CardPreviewProvider({ children, onNavigateToPack }: ProviderProps) {
  const [card, setCard] = useState<CardData | null>(null);

  const openPreview = useCallback((c: CardData) => setCard(c), []);
  const closePreview = useCallback(() => setCard(null), []);

  const value = useMemo(
    () => ({ openPreview, onNavigateToPack }),
    [openPreview, onNavigateToPack]
  );

  return (
    <CardPreviewContext.Provider value={value}>
      {children}
      <CardPreview card={card} onClose={closePreview} />
    </CardPreviewContext.Provider>
  );
}