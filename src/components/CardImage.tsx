// src/components/CardImage.tsx
interface Props {
  card: { id: number; image: string; name: string };
  className?: string;
  loading?: 'lazy' | 'eager';
}

export default function CardImage({ card, className, loading = 'lazy' }: Props) {
  return (
    <img
      src={card.image}
      alt={card.name}
      loading={loading}
      className={className}
      onError={e => {
        const img = e.currentTarget;
        if (img.dataset.fb) return;
        img.dataset.fb = '1';
        img.src = `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`;
      }}
    />
  );
}