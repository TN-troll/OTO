import { Router, Request, Response } from 'express';

export const rdwRouter = Router();

interface RdwVehicleData {
  kenteken: string;
  merk: string | null;
  handelsbenaming: string | null;
  eerste_kleur: string | null;
  brandstof_omschrijving: string | null;
  datum_eerste_toelating: string | null;
  datum_tenaamstelling: string | null;
  vervaldatum_apk: string | null;
  aantal_cilinders: string | null;
  cilinderinhoud: string | null;
  vermogen: string | null;
  catalogusprijs: string | null;
  tellerstandoordeel: string | null;
  wam_verzekerd: string | null;
  gestolen: string | null;
  export_indicator: string | null;
}

/**
 * GET /:kenteken
 * Lookup vehicle data from the RDW open data API.
 * Returns registration details, APK status, and basic vehicle info.
 */
rdwRouter.get('/:kenteken', async (req: Request, res: Response): Promise<void> => {
  const kenteken = req.params.kenteken as string;

  // Normalize plate: remove dashes/spaces, uppercase
  const normalized = kenteken.replace(/[-\s]/g, '').toUpperCase();

  if (normalized.length < 4 || normalized.length > 8) {
    res.status(400).json({ error: 'Invalid license plate format' });
    return;
  }

  try {
    // Query RDW Open Data API (Socrata-based)
    const rdwUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${normalized}`;
    const response = await fetch(rdwUrl);

    if (!response.ok) {
      res.status(502).json({ error: 'RDW API unavailable' });
      return;
    }

    const data = await response.json() as RdwVehicleData[];

    if (!data || data.length === 0) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const vehicle = data[0];

    // Also fetch APK history
    const apkUrl = `https://opendata.rdw.nl/resource/a34c-vvps.json?kenteken=${normalized}&$order=datum_toelichting_dt DESC&$limit=5`;
    let apkHistory: Array<{ date: string; result: string; mileage: string | null }> = [];

    try {
      const apkResponse = await fetch(apkUrl);
      if (apkResponse.ok) {
        const apkData = await apkResponse.json() as Array<{ datum_toelichting_dt?: string; soort_erkenning_omschrijving?: string; meld_datum_door_keuringsinstantie_dt?: string }>;
        apkHistory = apkData.map(entry => ({
          date: entry.meld_datum_door_keuringsinstantie_dt || entry.datum_toelichting_dt || '',
          result: entry.soort_erkenning_omschrijving || 'Unknown',
          mileage: null,
        }));
      }
    } catch {
      // APK history fetch failed — non-critical
    }

    res.json({
      plate: normalized,
      make: vehicle.merk,
      model: vehicle.handelsbenaming,
      color: vehicle.eerste_kleur,
      fuel: vehicle.brandstof_omschrijving,
      firstRegistration: vehicle.datum_eerste_toelating,
      lastOwnerChange: vehicle.datum_tenaamstelling,
      apkExpiry: vehicle.vervaldatum_apk,
      cylinders: vehicle.aantal_cilinders ? parseInt(vehicle.aantal_cilinders) : null,
      displacement: vehicle.cilinderinhoud ? parseInt(vehicle.cilinderinhoud) : null,
      power: vehicle.vermogen ? parseInt(vehicle.vermogen) : null,
      catalogPrice: vehicle.catalogusprijs ? parseInt(vehicle.catalogusprijs) : null,
      mileageJudgment: vehicle.tellerstandoordeel,
      insured: vehicle.wam_verzekerd,
      stolen: vehicle.gestolen,
      exported: vehicle.export_indicator,
      apkHistory,
    });
  } catch (err) {
    console.error('[OTO] RDW lookup error:', err);
    res.status(500).json({ error: 'Failed to lookup vehicle' });
  }
});
