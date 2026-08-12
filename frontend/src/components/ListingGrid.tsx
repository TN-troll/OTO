import type { ListingSummary } from '@car-ads/shared';
import { ListingCard } from './ListingCard';
import { ListingListItem } from './ListingListItem';

interface ListingGridProps {
  listings: ListingSummary[];
  view?: 'grid' | 'list';
}

export function ListingGrid({ listings, view = 'grid' }: ListingGridProps) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {listings.map((listing) => (
          <ListingListItem key={listing.id} listing={listing} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} featured={index === 0} />
      ))}
    </div>
  );
}
