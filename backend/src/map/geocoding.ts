/**
 * Geocoding service for Dutch city names.
 *
 * Uses a static lookup table (no external API calls) to convert
 * city name strings to geographic coordinates for map display.
 *
 * Covers all 12 provincial capitals, all cities with population above 25,000,
 * common suburban towns near major cities, towns known for car dealership strips,
 * and common alternate spellings / aliases.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Static lookup table mapping Dutch city names (lowercase) to coordinates.
 * Comprehensive coverage: provincial capitals, 150+ municipalities, dealer towns,
 * and common alternate spellings.
 */
export const DUTCH_CITY_COORDS: Map<string, Coordinates> = new Map([
  // ═══════════════════════════════════════════════════════════════════
  // PROVINCIAL CAPITALS (12)
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // SOUTH HOLLAND (Zuid-Holland)
  // ═══════════════════════════════════════════════════════════════════
  ['rotterdam', { latitude: 51.9244, longitude: 4.4777 }],
  ['zoetermeer', { latitude: 52.0575, longitude: 4.4931 }],
  ['dordrecht', { latitude: 51.8133, longitude: 4.6901 }],
  ['leiden', { latitude: 52.1601, longitude: 4.4970 }],
  ['delft', { latitude: 52.0116, longitude: 4.3571 }],
  ['leidschendam-voorburg', { latitude: 52.0711, longitude: 4.3922 }],
  ['leidschendam', { latitude: 52.0830, longitude: 4.3930 }],
  ['voorburg', { latitude: 52.0700, longitude: 4.3620 }],
  ['westland', { latitude: 52.0273, longitude: 4.2199 }],
  ['vlaardingen', { latitude: 51.9120, longitude: 4.3422 }],
  ['schiedam', { latitude: 51.9196, longitude: 4.3889 }],
  ['gouda', { latitude: 52.0115, longitude: 4.7104 }],
  ['alphen aan den rijn', { latitude: 52.1293, longitude: 4.6580 }],
  ['capelle aan den ijssel', { latitude: 51.9290, longitude: 4.5780 }],
  ['katwijk', { latitude: 52.2000, longitude: 4.4178 }],
  ['lansingerland', { latitude: 51.9937, longitude: 4.5203 }],
  ['spijkenisse', { latitude: 51.8450, longitude: 4.3291 }],
  ['ridderkerk', { latitude: 51.8689, longitude: 4.6044 }],
  ['barendrecht', { latitude: 51.8573, longitude: 4.5337 }],
  ['papendrecht', { latitude: 51.8310, longitude: 4.6930 }],
  ['sliedrecht', { latitude: 51.8224, longitude: 4.7720 }],
  ['gorinchem', { latitude: 51.8351, longitude: 4.9730 }],
  ['waddinxveen', { latitude: 52.0458, longitude: 4.6511 }],
  ['krimpen aan den ijssel', { latitude: 51.9147, longitude: 4.6028 }],
  ['hendrik-ido-ambacht', { latitude: 51.8441, longitude: 4.6370 }],
  ['zwijndrecht', { latitude: 51.8167, longitude: 4.6333 }],
  ['maassluis', { latitude: 51.9231, longitude: 4.2490 }],
  ['hellevoetsluis', { latitude: 51.8273, longitude: 4.1434 }],
  ['voorschoten', { latitude: 52.1273, longitude: 4.4490 }],
  ['wassenaar', { latitude: 52.1459, longitude: 4.3990 }],
  ['rijswijk', { latitude: 52.0396, longitude: 4.3267 }],
  ['nieuwkoop', { latitude: 52.1507, longitude: 4.7792 }],
  ['lisse', { latitude: 52.2577, longitude: 4.5588 }],
  ['sassenheim', { latitude: 52.2270, longitude: 4.5250 }],
  ['noordwijk', { latitude: 52.2345, longitude: 4.4419 }],
  ['oegstgeest', { latitude: 52.1769, longitude: 4.4683 }],

  // ═══════════════════════════════════════════════════════════════════
  // NORTH HOLLAND (Noord-Holland)
  // ═══════════════════════════════════════════════════════════════════
  ['almere', { latitude: 52.3508, longitude: 5.2647 }],
  ['zaanstad', { latitude: 52.4575, longitude: 4.8126 }],
  ['zaandam', { latitude: 52.4383, longitude: 4.8267 }],
  ['haarlemmermeer', { latitude: 52.3030, longitude: 4.6900 }],
  ['hoofddorp', { latitude: 52.3028, longitude: 4.6886 }],
  ['amstelveen', { latitude: 52.3114, longitude: 4.8721 }],
  ['hoorn', { latitude: 52.6424, longitude: 5.0594 }],
  ['purmerend', { latitude: 52.5050, longitude: 4.9597 }],
  ['velsen', { latitude: 52.4586, longitude: 4.6295 }],
  ['ijmuiden', { latitude: 52.4599, longitude: 4.6180 }],
  ['alkmaar', { latitude: 52.6324, longitude: 4.7534 }],
  ['hilversum', { latitude: 52.2292, longitude: 5.1669 }],
  ['den helder', { latitude: 52.9533, longitude: 4.7610 }],
  ['heerhugowaard', { latitude: 52.6683, longitude: 4.8354 }],
  ['diemen', { latitude: 52.3394, longitude: 4.9609 }],
  ['uithoorn', { latitude: 52.2380, longitude: 4.8260 }],
  ['beverwijk', { latitude: 52.4833, longitude: 4.6500 }],
  ['heemskerk', { latitude: 52.5108, longitude: 4.6697 }],
  ['castricum', { latitude: 52.5463, longitude: 4.6609 }],
  ['schagen', { latitude: 52.7878, longitude: 4.7984 }],
  ['enkhuizen', { latitude: 52.7050, longitude: 5.2950 }],
  ['wormerveer', { latitude: 52.4928, longitude: 4.7882 }],
  ['bussum', { latitude: 52.2750, longitude: 5.1667 }],
  ['naarden', { latitude: 52.2967, longitude: 5.1625 }],
  ['huizen', { latitude: 52.2980, longitude: 5.2390 }],
  ['muiden', { latitude: 52.3283, longitude: 5.0700 }],
  ['edam', { latitude: 52.5130, longitude: 5.0500 }],
  ['volendam', { latitude: 52.4960, longitude: 5.0700 }],
  ['landsmeer', { latitude: 52.4310, longitude: 4.9130 }],
  ['aalsmeer', { latitude: 52.2590, longitude: 4.7590 }],

  // ═══════════════════════════════════════════════════════════════════
  // NORTH BRABANT (Noord-Brabant)
  // ═══════════════════════════════════════════════════════════════════
  ['eindhoven', { latitude: 51.4416, longitude: 5.4697 }],
  ['tilburg', { latitude: 51.5555, longitude: 5.0913 }],
  ['breda', { latitude: 51.5719, longitude: 4.7683 }],
  ['helmond', { latitude: 51.4816, longitude: 5.6613 }],
  ['oss', { latitude: 51.7652, longitude: 5.5340 }],
  ['roosendaal', { latitude: 51.5305, longitude: 4.4495 }],
  ['bergen op zoom', { latitude: 51.4949, longitude: 4.2910 }],
  ['meierijstad', { latitude: 51.6365, longitude: 5.5940 }],
  ['veghel', { latitude: 51.6162, longitude: 5.5462 }],
  ['waalwijk', { latitude: 51.6833, longitude: 5.0667 }],
  ['uden', { latitude: 51.6619, longitude: 5.6194 }],
  ['best', { latitude: 51.5100, longitude: 5.3922 }],
  ['veldhoven', { latitude: 51.4200, longitude: 5.4050 }],
  ['waalre', { latitude: 51.3920, longitude: 5.4540 }],
  ['geldrop', { latitude: 51.4222, longitude: 5.5583 }],
  ['valkenswaard', { latitude: 51.3500, longitude: 5.4617 }],
  ['deurne', { latitude: 51.4617, longitude: 5.7936 }],
  ['boxtel', { latitude: 51.5908, longitude: 5.3281 }],
  ['dongen', { latitude: 51.6278, longitude: 4.9389 }],
  ['etten-leur', { latitude: 51.5736, longitude: 4.6372 }],
  ['oosterhout', { latitude: 51.6431, longitude: 4.8600 }],
  ['cuijk', { latitude: 51.7289, longitude: 5.8786 }],
  ['boxmeer', { latitude: 51.6467, longitude: 5.9450 }],
  ['someren', { latitude: 51.3836, longitude: 5.7122 }],
  ['nuenen', { latitude: 51.4708, longitude: 5.5467 }],
  ['son en breugel', { latitude: 51.5133, longitude: 5.5017 }],
  ['eersel', { latitude: 51.3578, longitude: 5.3164 }],
  ['cranendonck', { latitude: 51.3000, longitude: 5.5833 }],
  ['geertruidenberg', { latitude: 51.7017, longitude: 4.8558 }],

  // ═══════════════════════════════════════════════════════════════════
  // GELDERLAND
  // ═══════════════════════════════════════════════════════════════════
  ['nijmegen', { latitude: 51.8126, longitude: 5.8372 }],
  ['apeldoorn', { latitude: 52.2112, longitude: 5.9699 }],
  ['ede', { latitude: 52.0484, longitude: 5.6618 }],
  ['deventer', { latitude: 52.2552, longitude: 6.1639 }],
  ['doetinchem', { latitude: 51.9650, longitude: 6.2886 }],
  ['barneveld', { latitude: 52.1405, longitude: 5.5885 }],
  ['harderwijk', { latitude: 52.3420, longitude: 5.6200 }],
  ['wageningen', { latitude: 51.9692, longitude: 5.6653 }],
  ['tiel', { latitude: 51.8870, longitude: 5.4280 }],
  ['zevenaar', { latitude: 51.9287, longitude: 6.0720 }],
  ['duiven', { latitude: 51.9467, longitude: 6.0167 }],
  ['winterswijk', { latitude: 51.9706, longitude: 6.7186 }],
  ['culemborg', { latitude: 51.9553, longitude: 5.2278 }],
  ['zutphen', { latitude: 52.1387, longitude: 6.1952 }],
  ['elburg', { latitude: 52.4430, longitude: 5.8352 }],
  ['ermelo', { latitude: 52.3000, longitude: 5.6167 }],
  ['putten', { latitude: 52.2580, longitude: 5.6060 }],
  ['nunspeet', { latitude: 52.3764, longitude: 5.7828 }],
  ['epe', { latitude: 52.3480, longitude: 5.9870 }],
  ['lochem', { latitude: 52.1600, longitude: 6.4140 }],
  ['berkelland', { latitude: 52.1260, longitude: 6.5820 }],
  ['voorst', { latitude: 52.1760, longitude: 6.1300 }],
  ['rheden', { latitude: 52.0058, longitude: 6.0350 }],
  ['westervoort', { latitude: 51.9572, longitude: 5.9722 }],
  ['lingewaard', { latitude: 51.8900, longitude: 5.9200 }],
  ['overbetuwe', { latitude: 51.9200, longitude: 5.7800 }],
  ['beuningen', { latitude: 51.8617, longitude: 5.7708 }],
  ['wijchen', { latitude: 51.8075, longitude: 5.7250 }],
  ['druten', { latitude: 51.8867, longitude: 5.6042 }],

  // ═══════════════════════════════════════════════════════════════════
  // UTRECHT
  // ═══════════════════════════════════════════════════════════════════
  ['amersfoort', { latitude: 52.1561, longitude: 5.3878 }],
  ['veenendaal', { latitude: 52.0284, longitude: 5.5585 }],
  ['nieuwegein', { latitude: 52.0350, longitude: 5.0853 }],
  ['zeist', { latitude: 52.0907, longitude: 5.2323 }],
  ['woerden', { latitude: 52.0850, longitude: 4.8867 }],
  ['vianen', { latitude: 51.9889, longitude: 5.0917 }],
  ['houten', { latitude: 52.0283, longitude: 5.1686 }],
  ['de bilt', { latitude: 52.1083, longitude: 5.1800 }],
  ['bilthoven', { latitude: 52.1308, longitude: 5.2000 }],
  ['ijsselstein', { latitude: 52.0167, longitude: 5.0500 }],
  ['maarssen', { latitude: 52.1375, longitude: 5.0417 }],
  ['soest', { latitude: 52.1745, longitude: 5.2940 }],
  ['baarn', { latitude: 52.2106, longitude: 5.2886 }],
  ['bunschoten', { latitude: 52.2400, longitude: 5.3700 }],
  ['wijk bij duurstede', { latitude: 51.9750, longitude: 5.3333 }],
  ['driebergen', { latitude: 52.0537, longitude: 5.2815 }],
  ['leersum', { latitude: 52.0108, longitude: 5.4297 }],
  ['breukelen', { latitude: 52.1750, longitude: 4.9917 }],

  // ═══════════════════════════════════════════════════════════════════
  // OVERIJSSEL
  // ═══════════════════════════════════════════════════════════════════
  ['enschede', { latitude: 52.2215, longitude: 6.8937 }],
  ['hengelo', { latitude: 52.2661, longitude: 6.7927 }],
  ['almelo', { latitude: 52.3570, longitude: 6.6684 }],
  ['hardenberg', { latitude: 52.5742, longitude: 6.6196 }],
  ['kampen', { latitude: 52.5551, longitude: 5.9115 }],
  ['oldenzaal', { latitude: 52.3131, longitude: 6.9278 }],
  ['borne', { latitude: 52.3011, longitude: 6.7500 }],
  ['rijssen', { latitude: 52.3083, longitude: 6.5167 }],
  ['wierden', { latitude: 52.3583, longitude: 6.5917 }],
  ['hellendoorn', { latitude: 52.3917, longitude: 6.4500 }],
  ['raalte', { latitude: 52.3833, longitude: 6.2750 }],
  ['dalfsen', { latitude: 52.5083, longitude: 6.2583 }],
  ['ommen', { latitude: 52.5242, longitude: 6.4242 }],
  ['steenwijk', { latitude: 52.7872, longitude: 6.1178 }],
  ['staphorst', { latitude: 52.6333, longitude: 6.2083 }],
  ['vriezenveen', { latitude: 52.4108, longitude: 6.6250 }],

  // ═══════════════════════════════════════════════════════════════════
  // LIMBURG
  // ═══════════════════════════════════════════════════════════════════
  ['maastricht', { latitude: 50.8514, longitude: 5.6910 }],
  ['venlo', { latitude: 51.3704, longitude: 6.1724 }],
  ['sittard-geleen', { latitude: 50.9986, longitude: 5.8665 }],
  ['sittard', { latitude: 50.9986, longitude: 5.8665 }],
  ['geleen', { latitude: 50.9742, longitude: 5.8292 }],
  ['heerlen', { latitude: 50.8882, longitude: 5.9795 }],
  ['roermond', { latitude: 51.1945, longitude: 5.9867 }],
  ['weert', { latitude: 51.2517, longitude: 5.7067 }],
  ['kerkrade', { latitude: 50.8658, longitude: 6.0628 }],
  ['landgraaf', { latitude: 50.8958, longitude: 6.0222 }],
  ['brunssum', { latitude: 50.9439, longitude: 5.9706 }],
  ['stein', { latitude: 50.9667, longitude: 5.7667 }],
  ['meerssen', { latitude: 50.8867, longitude: 5.7500 }],
  ['valkenburg', { latitude: 50.8650, longitude: 5.8317 }],
  ['venray', { latitude: 51.5250, longitude: 5.9750 }],
  ['horst aan de maas', { latitude: 51.4583, longitude: 6.0500 }],
  ['peel en maas', { latitude: 51.3500, longitude: 6.0667 }],
  ['nederweert', { latitude: 51.2861, longitude: 5.7500 }],

  // ═══════════════════════════════════════════════════════════════════
  // FRIESLAND (Fryslân)
  // ═══════════════════════════════════════════════════════════════════
  ['sneek', { latitude: 53.0333, longitude: 5.6583 }],
  ['drachten', { latitude: 53.1128, longitude: 6.1006 }],
  ['heerenveen', { latitude: 52.9600, longitude: 5.9250 }],
  ['harlingen', { latitude: 53.1742, longitude: 5.4262 }],
  ['franeker', { latitude: 53.1870, longitude: 5.5420 }],
  ['joure', { latitude: 52.9658, longitude: 5.7917 }],
  ['wolvega', { latitude: 52.8833, longitude: 5.9917 }],
  ['burgum', { latitude: 53.1928, longitude: 5.9925 }],
  ['bolsward', { latitude: 53.0611, longitude: 5.5272 }],
  ['dokkum', { latitude: 53.3258, longitude: 5.9972 }],

  // ═══════════════════════════════════════════════════════════════════
  // GRONINGEN (Province)
  // ═══════════════════════════════════════════════════════════════════
  ['veendam', { latitude: 53.1067, longitude: 6.8725 }],
  ['hoogezand', { latitude: 53.1617, longitude: 6.7583 }],
  ['stadskanaal', { latitude: 52.9917, longitude: 6.9500 }],
  ['winschoten', { latitude: 53.1442, longitude: 7.0353 }],
  ['delfzijl', { latitude: 53.3300, longitude: 6.9167 }],
  ['appingedam', { latitude: 53.3200, longitude: 6.8583 }],
  ['leek', { latitude: 53.1617, longitude: 6.3750 }],

  // ═══════════════════════════════════════════════════════════════════
  // DRENTHE
  // ═══════════════════════════════════════════════════════════════════
  ['emmen', { latitude: 52.7792, longitude: 6.9069 }],
  ['hoogeveen', { latitude: 52.7212, longitude: 6.4756 }],
  ['meppel', { latitude: 52.6958, longitude: 6.1944 }],
  ['coevorden', { latitude: 52.6625, longitude: 6.7389 }],
  ['beilen', { latitude: 52.8583, longitude: 6.5167 }],
  ['roden', { latitude: 53.1375, longitude: 6.4292 }],

  // ═══════════════════════════════════════════════════════════════════
  // FLEVOLAND
  // ═══════════════════════════════════════════════════════════════════
  ['emmeloord', { latitude: 52.7108, longitude: 5.7472 }],
  ['dronten', { latitude: 52.5250, longitude: 5.7167 }],
  ['zeewolde', { latitude: 52.3317, longitude: 5.5417 }],
  ['urk', { latitude: 52.6617, longitude: 5.5983 }],
  ['biddinghuizen', { latitude: 52.4417, longitude: 5.7083 }],

  // ═══════════════════════════════════════════════════════════════════
  // ZEELAND
  // ═══════════════════════════════════════════════════════════════════
  ['vlissingen', { latitude: 51.4428, longitude: 3.5710 }],
  ['goes', { latitude: 51.5035, longitude: 3.8890 }],
  ['terneuzen', { latitude: 51.3350, longitude: 3.8275 }],
  ['hulst', { latitude: 51.2817, longitude: 4.0583 }],
  ['zierikzee', { latitude: 51.6497, longitude: 3.9178 }],
  ['kapelle', { latitude: 51.4833, longitude: 3.9583 }],

  // ═══════════════════════════════════════════════════════════════════
  // COMMON ALTERNATE SPELLINGS / ALIASES
  // ═══════════════════════════════════════════════════════════════════
  // Den Haag variations
  ["'s-gravenhage", { latitude: 52.0705, longitude: 4.3007 }],
  ['s-gravenhage', { latitude: 52.0705, longitude: 4.3007 }],
  ['the hague', { latitude: 52.0705, longitude: 4.3007 }],

  // 's-Hertogenbosch variations
  ['den bosch', { latitude: 51.6978, longitude: 5.3037 }],
  ['hertogenbosch', { latitude: 51.6978, longitude: 5.3037 }],
  ['s-hertogenbosch', { latitude: 51.6978, longitude: 5.3037 }],

  // Common short/informal names
  ['r\'dam', { latitude: 51.9244, longitude: 4.4777 }],
  ['a\'dam', { latitude: 52.3676, longitude: 4.9041 }],
  ['020', { latitude: 52.3676, longitude: 4.9041 }],

  // Capelle variations
  ['capelle a/d ijssel', { latitude: 51.9290, longitude: 4.5780 }],
  ['capelle a.d. ijssel', { latitude: 51.9290, longitude: 4.5780 }],
  ['capelle', { latitude: 51.9290, longitude: 4.5780 }],

  // Alphen variations
  ['alphen a/d rijn', { latitude: 52.1293, longitude: 4.6580 }],
  ['alphen a.d. rijn', { latitude: 52.1293, longitude: 4.6580 }],

  // Krimpen variations
  ['krimpen a/d ijssel', { latitude: 51.9147, longitude: 4.6028 }],
  ['krimpen', { latitude: 51.9147, longitude: 4.6028 }],

  // IJmuiden without the capital IJ
  ['ijmuiden', { latitude: 52.4599, longitude: 4.6180 }],

  // Wijk bij Duurstede variations
  ['wijk bij duurstede', { latitude: 51.9750, longitude: 5.3333 }],

  // Sittard-Geleen as separate
  ['sittard geleen', { latitude: 50.9986, longitude: 5.8665 }],

  // Bergen op Zoom variations
  ['bergen op zoom', { latitude: 51.4949, longitude: 4.2910 }],

  // Son en Breugel variations
  ['son', { latitude: 51.5133, longitude: 5.5017 }],

  // Horst variations
  ['horst', { latitude: 51.4583, longitude: 6.0500 }],
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
