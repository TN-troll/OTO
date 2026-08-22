import { useState } from 'react';
import { useLanguage } from '../i18n';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

interface RdwData {
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  fuel: string | null;
  firstRegistration: string | null;
  lastOwnerChange: string | null;
  apkExpiry: string | null;
  cylinders: number | null;
  displacement: number | null;
  power: number | null;
  catalogPrice: number | null;
  mileageJudgment: string | null;
  insured: string | null;
  stolen: string | null;
  exported: string | null;
}

/**
 * RDW license plate lookup component.
 * Shows on listing detail pages — allows buyers to check vehicle registration status.
 */
export function RdwCheck() {
  const { locale } = useLanguage();
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RdwData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (plate.length < 4) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/rdw/${encodeURIComponent(plate)}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(err.error || 'Vehicle not found');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '\u2014';
    // RDW dates are YYYYMMDD format
    if (d.length === 8) return `${d.slice(6, 8)}-${d.slice(4, 6)}-${d.slice(0, 4)}`;
    return d;
  };

  return (
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white">
        {locale === 'nl' ? '\uD83D\uDD0D RDW Kentekencheck' : '\uD83D\uDD0D RDW Plate Check'}
      </h3>
      <p className="mt-1 text-xs text-surface-400">
        {locale === 'nl' ? 'Controleer APK, eigenaar en voertuiggegevens' : 'Check MOT, ownership and vehicle details'}
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder={locale === 'nl' ? 'XX-XXX-X' : 'License plate'}
          className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
          maxLength={9}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
        />
        <button
          onClick={handleLookup}
          disabled={loading || plate.length < 4}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading ? '...' : 'Check'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}

      {data && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? 'Merk' : 'Make'}</p>
            <p className="font-medium text-white">{data.make || '\u2014'}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">Model</p>
            <p className="font-medium text-white">{data.model || '\u2014'}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? 'Kleur' : 'Color'}</p>
            <p className="font-medium text-white">{data.color || '\u2014'}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${data.apkExpiry && new Date(data.apkExpiry.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) > new Date() ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <p className="text-surface-500">APK {locale === 'nl' ? 'vervalt' : 'expires'}</p>
            <p className="font-medium text-white">{formatDate(data.apkExpiry)}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? '1e registratie' : 'First reg.'}</p>
            <p className="font-medium text-white">{formatDate(data.firstRegistration)}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? 'Brandstof' : 'Fuel'}</p>
            <p className="font-medium text-white">{data.fuel || '\u2014'}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? 'Vermogen' : 'Power'}</p>
            <p className="font-medium text-white">{data.power ? `${data.power} kW` : '\u2014'}</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-2.5">
            <p className="text-surface-500">{locale === 'nl' ? 'Nieuwprijs' : 'List price'}</p>
            <p className="font-medium text-white">{data.catalogPrice ? `\u20AC${data.catalogPrice.toLocaleString('nl-NL')}` : '\u2014'}</p>
          </div>
          {data.stolen && (
            <div className={`rounded-lg p-2.5 ${data.stolen === 'Nee' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <p className="text-surface-500">{locale === 'nl' ? 'Gestolen' : 'Stolen'}</p>
              <p className="font-medium text-white">{data.stolen}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
