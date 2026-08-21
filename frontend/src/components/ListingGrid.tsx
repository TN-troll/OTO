import type { ListingSummary } from '@car-ads/shared';
import { ListingCard } from './ListingCard';
import { ListingListItem } from './ListingListItem';

interface ListingGridProps {
  listings: ListingSummary[];
  view?: 'grid' | 'list';
}

/** Stagger animation classes for the first 6 items, then instant for the rest */
const STAGGER_CLASSES = [
  'animate-stagger-1',
  'animate-stagger-2',
  'animate-stagger-3',
  'animate-stagger-4',
  'animate-stagger-5',
  'animate-stagger-6',
];

export function ListingGrid({ listings, view = 'grid' }: ListingGridProps) {
  if (view === 'list') {
    return (
      <div className="flex w-full max-w-full flex-col gap-4">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className={index < STAGGER_CLASSES.length ? STAGGER_CLASSES[index] : 'animate-fade-in'}
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
          className={index < STAGGER_CLASSES.length ? STAGGER_CLASSES[index] : 'animate-fade-in'}
        >
          <ListingCard listing={listing} featured={index === 0} priority={index === 0} />
        </div>
      ))}
    </div>
  );
}
