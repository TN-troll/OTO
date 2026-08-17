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
      <div className="flex w-full max-w-full flex-col gap-4">
        {listings.map((listing) => (
          <ListingListItem key={listing.id} listing={listing} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {listings.map((listing, index) => (
        <div key={listing.id} className="listing-card-row">
          <ListingCard listing={listing} featured={index === 0} priority={index === 0} />
        </div>
      ))}
    </div>
  );
}
