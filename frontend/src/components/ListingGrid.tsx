import type { ListingSummary } from '@car-ads/shared';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: ListingSummary[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
