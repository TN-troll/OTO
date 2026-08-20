/**
 * Geocoding service for Dutch city names.
 *
 * Uses a static lookup table (no external API calls) to convert
 * city name strings to geographic coordinates for map display.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Static lookup table mapping Dutch city names (lowercase) to coordinates.
 * Covers all 12 provincial capitals and cities with population above 50,000.
 */
export const DUTCH_CITY_COORDS: Map<string, Coordinates> = new Map([
  // === Provincial capitals (12) ===
  ['amsterdam', { latitude: 52.3676, longitude: 4.9041 }],
  ['haarlem', { latitude: 52.3874, longitude: 4.6462 }],
  ['den haag', { latitude: 52.0705, longitude: 4.3007 }],
  ['lelystad', { latitude: 52.5185, longitude: 5.4714 }],
  ['middelburg', { latitude: 51.4988, longitude: 3.6109 }],
  ["'s-hertogenbosch", { latitude: 51.6978, longitude: 5.3037 }],
  ['utrecht', { latitude: 52.0907, longitude: 5.1214 }],
  ['arnhem', { latitude: 51.9851, longitude: 5.8987 }],
  ['zwolle', { latitude: 52.5168, longitude: 6.0830 }],
  ['leeuwarden', { latitude: 53.2012, longitude: 5.7999 }],
  ['groningen', { latitude: 53.2194, longitude: 6.5665 }],
  ['assen', { latitude: 52.9929, longitude: 6.5642 }],

  // === Cities with population above 50,000 ===
  ['rotterdam', { latitude: 51.9244, longitude: 4.4777 }],
  ['eindhoven', { latitude: 51.4416, longitude: 5.4697 }],
  ['tilburg', { latitude: 51.5555, longitude: 5.0913 }],
  ['almere', { latitude: 52.3508, longitude: 5.2647 }],
  ['breda', { latitude: 51.5719, longitude: 4.7683 }],
  ['nijmegen', { latitude: 51.8126, longitude: 5.8372 }],
  ['enschede', { latitude: 52.2215, longitude: 6.8937 }],
  ['apeldoorn', { latitude: 52.2112, longitude: 5.9699 }],
  ['hengelo', { latitude: 52.2661, longitude: 6.7927 }],
  ['amersfoort', { latitude: 52.1561, longitude: 5.3878 }],
  ['zaanstad', { latitude: 52.4575, longitude: 4.8126 }],
  ['haarlemmermeer', { latitude: 52.3030, longitude: 4.6900 }],
  ['zoetermeer', { latitude: 52.0575, longitude: 4.4931 }],
  ['dordrecht', { latitude: 51.8133, longitude: 4.6901 }],
  ['leiden', { latitude: 52.1601, longitude: 4.4970 }],
  ['maastricht', { latitude: 50.8514, longitude: 5.6910 }],
  ['ede', { latitude: 52.0484, longitude: 5.6618 }],
  ['emmen', { latitude: 52.7792, longitude: 6.9069 }],
  ['deventer', { latitude: 52.2552, longitude: 6.1639 }],
  ['delft', { latitude: 52.0116, longitude: 4.3571 }],
  ['sittard-geleen', { latitude: 50.9986, longitude: 5.8665 }],
  ['venlo', { latitude: 51.3704, longitude: 6.1724 }],
  ['leidschendam-voorburg', { latitude: 52.0711, longitude: 4.3922 }],
  ['westland', { latitude: 52.0273, longitude: 4.2199 }],
  ['helmond', { latitude: 51.4816, longitude: 5.6613 }],
  ['hilversum', { latitude: 52.2292, longitude: 5.1669 }],
  ['oss', { latitude: 51.7652, longitude: 5.5340 }],
  ['roosendaal', { latitude: 51.5305, longitude: 4.4495 }],
  ['vlaardingen', { latitude: 51.9120, longitude: 4.3422 }],
  ['schiedam', { latitude: 51.9196, longitude: 4.3889 }],
  ['almelo', { latitude: 52.3570, longitude: 6.6684 }],
  ['gouda', { latitude: 52.0115, longitude: 4.7104 }],
  ['amstelveen', { latitude: 52.3114, longitude: 4.8721 }],
  ['bergen op zoom', { latitude: 51.4949, longitude: 4.2910 }],
  ['woerden', { latitude: 52.0850, longitude: 4.8867 }],
  ['hoorn', { latitude: 52.6424, longitude: 5.0594 }],
  ['purmerend', { latitude: 52.5050, longitude: 4.9597 }],
  ['spijkenisse', { latitude: 51.8450, longitude: 4.3291 }],
  ['veenendaal', { latitude: 52.0284, longitude: 5.5585 }],
  ['den helder', { latitude: 52.9533, longitude: 4.7610 }],
  ['barneveld', { latitude: 52.1405, longitude: 5.5885 }],
  ['alphen aan den rijn', { latitude: 52.1293, longitude: 4.6580 }],
  ['nieuwegein', { latitude: 52.0350, longitude: 5.0853 }],
  ['zeist', { latitude: 52.0907, longitude: 5.2323 }],
  ['hardenberg', { latitude: 52.5742, longitude: 6.6196 }],
  ['kampen', { latitude: 52.5551, longitude: 5.9115 }],
  ['velsen', { latitude: 52.4586, longitude: 4.6295 }],
  ['capelle aan den ijssel', { latitude: 51.9290, longitude: 4.5780 }],
  ['alkmaar', { latitude: 52.6324, longitude: 4.7534 }],
  ['katwijk', { latitude: 52.2000, longitude: 4.4178 }],
  ['lansingerland', { latitude: 51.9937, longitude: 4.5203 }],
  ['meierijstad', { latitude: 51.6365, longitude: 5.5940 }],
  ['hoogeveen', { latitude: 52.7212, longitude: 6.4756 }],
  ['doetinchem', { latitude: 51.9650, longitude: 6.2886 }],
]);

/**
 * Geocode a Dutch city name to geographic coordinates.
 * Performs case-insensitive lookup with input trimming.
 *
 * @param cityName - The city name to look up
 * @returns Coordinates if found, null otherwise
 */
export function geocodeCity(cityName: string): Coordinates | null {
  const normalized = cityName.trim().toLowerCase();
  return DUTCH_CITY_COORDS.get(normalized) ?? null;
}

/**
 * Check whether a city name can be geocoded (exists in the lookup table).
 * Returns false for null, undefined, empty, or unknown city names.
 *
 * @param cityName - The city name to check
 * @returns true if the city name can be resolved to coordinates
 */
export function isGeocodable(cityName: string | null | undefined): boolean {
  if (!cityName) {
    return false;
  }
  const normalized = cityName.trim().toLowerCase();
  if (normalized === '') {
    return false;
  }
  return DUTCH_CITY_COORDS.has(normalized);
}
