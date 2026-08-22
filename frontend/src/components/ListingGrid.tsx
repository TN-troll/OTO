import { useRef, useEffect, useState } from 'react';
import type { ListingSummary } from '@car-ads/shared';
import { ListingCard } from './ListingCard';
import { ListingListItem } from './ListingListItem';

interface ListingGridProps {
  listings: ListingSummary[];
  view?: 'grid' | 'list';
}

/** Number of items to stagger on each batch load */
const STAGGER_COUNT = 6;
const STAGGER_DELAY_MS = 50;

export function ListingGrid({ listings, view = 'grid' }: ListingGridProps) {
  const prevCountRef = useRef(0);
  const [animateFrom, setAnimateFrom] = useState(0);

  // Track when new items are added (infinite scroll)
  useEffect(() => {
    if (listings.length > prevCountRef.current) {
      setAnimateFrom(prevCountRef.current);
    }
    prevCountRef.current = listings.length;
  }, [listings.length]);

  const getAnimationStyle = (index: number) => {
    if (index < animateFrom) return {}; // Already visible, no animation
    const relativeIndex = index - animateFrom;
    if (relativeIndex >= STAGGER_COUNT) return {}; // Beyond stagger range
    return { animationDelay: `${relativeIndex * STAGGER_DELAY_MS}ms` };
  };

  const getAnimationClass = (index: number) => {
    if (index < animateFrom) return '';
    const relativeIndex = index - animateFrom;
    if (relativeIndex < STAGGER_COUNT) return 'animate-fade-in-up motion-reduce:animate-none';
    return 'animate-fade-in motion-reduce:animate-none';
  };

  if (view === 'list') {
    return (
      <div className="flex w-full max-w-full flex-col gap-4">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className={getAnimationClass(index)}
            style={getAnimationStyle(index)}
          >
            <ListingListItem listing={listing} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className={getAnimationClass(index)}
          style={getAnimationStyle(index)}
        >
          <ListingCard listing={listing} featured={index === 0 && animateFrom === 0} priority={index < 3} />
        </div>
      ))}
    </div>
  );
}
