import { v4 as uuidv4 } from 'uuid';
import { MAX_IMAGES_PER_LISTING } from '@car-ads/shared';
import type { RawAdvertisement } from '@car-ads/shared';
import type { SellerType, TransmissionType, FuelType } from '@car-ads/shared';

/**
 * Represents a listing row as stored in the database.
 * This is the "flat" form that maps to the PostgreSQL `listings` table.
 */
export interface ListingRow {
  id: string;
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engine_displacement_cc: number | null;
  horsepower: number | null;
  location: string | null;
  seller_type: SellerType | null;
  transmission_type: TransmissionType | null;
  fuel_type: FuelType | null;
  image_urls: string[];
  source_url: string;
  status: 'active' | 'inactive';
  date_added: Date;
  last_verified: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Represents the retrieved listing data (after reading from a ListingRow).
 */
export interface RetrievedListing {
  id: string;
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: SellerType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  imageUrls: string[];
  sourceUrl: string;
  status: 'active' | 'inactive';
  dateAdded: Date;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts a valid RawAdvertisement (with all mandatory fields present) into a ListingRow
 * ready for database insertion. Images are truncated to MAX_IMAGES_PER_LISTING (20).
 *
 * Precondition: price, make, model, and year must be non-null.
 */
export function toListingRow(ad: RawAdvertisement): ListingRow {
  const now = new Date();
  return {
    id: uuidv4(),
    title: ad.title,
    price: ad.price!,
    mileage: ad.mileage,
    year: ad.year!,
    make: ad.make!,
    model: ad.model!,
    engine_displacement_cc: ad.engineDisplacementCc,
    horsepower: ad.horsepower,
    location: ad.location,
    seller_type: ad.sellerType,
    transmission_type: ad.transmissionType,
    fuel_type: ad.fuelType,
    image_urls: ad.imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
    source_url: ad.sourceUrl,
    status: 'active',
    date_added: now,
    last_verified: now,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Converts a ListingRow (database representation) back to a RetrievedListing object.
 */
export function fromListingRow(row: ListingRow): RetrievedListing {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    mileage: row.mileage,
    year: row.year,
    make: row.make,
    model: row.model,
    engineDisplacementCc: row.engine_displacement_cc,
    horsepower: row.horsepower,
    location: row.location,
    sellerType: row.seller_type,
    transmissionType: row.transmission_type,
    fuelType: row.fuel_type,
    imageUrls: row.image_urls,
    sourceUrl: row.source_url,
    status: row.status,
    dateAdded: row.date_added,
    lastVerified: row.last_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
