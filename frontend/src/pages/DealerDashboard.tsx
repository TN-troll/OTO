import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

interface AdStats {
  id: string;
  title: string;
  placement: string;
  clicks: number;
  impressions: number;
  ctr: string;
  isActive: boolean;
}

export function DealerDashboard() {
  const { locale } = useLanguage();
  const [ads, setAds] = useState<AdStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', linkUrl: '', imageUrl: '', placement: 'feed', priority: 50 });

  useEffect(() => {
    document.title = 'Dealer Dashboard | OTO';
    fetch(`${API_BASE}/ads/stats`)
      .then(r => r.ok ? r.json() : { ads: [] })
      .then(data => setAds(data.ads || []))
      .finally(() => setLoading(false));
    return () => { document.title = 'OTO — The Online Trade Occasions Platform'; };
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.linkUrl) return;
    const res = await fetch(`${API_BASE}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ title: '', description: '', linkUrl: '', imageUrl: '', placement: 'feed', priority: 50 });
      // Refresh
      const data = await (await fetch(`${API_BASE}/ads/stats`)).json();
      setAds(data.ads || []);
    }
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`${API_BASE}/ads/${id}`, { method: 'DELETE' });
    setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: false } : a));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dealer Dashboard</h1>
          <p className="mt-1 text-sm text-surface-400">{locale === 'nl' ? 'Beheer uw advertenties en bekijk prestaties' : 'Manage your ads and view performance'}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95"
        >
          + {locale === 'nl' ? 'Nieuwe advertentie' : 'New ad'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 space-y-4">
          <input
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
          />
          <input
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
          />
          <input
            value={formData.linkUrl}
            onChange={e => setFormData(p => ({ ...p, linkUrl: e.target.value }))}
            placeholder="Link URL"
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
          />
          <input
            value={formData.imageUrl}
            onChange={e => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
            placeholder="Image URL (optional)"
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
          />
          <div className="flex gap-3">
            <select
              value={formData.placement}
              onChange={e => setFormData(p => ({ ...p, placement: e.target.value }))}
              className="rounded-lg border border-white/[0.1] bg-surface-800 px-3 py-2 text-sm text-white"
            >
              <option value="feed">Feed</option>
              <option value="sidebar">Sidebar</option>
              <option value="detail">Detail page</option>
              <option value="header">Header</option>
            </select>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-brand-accent px-5 py-2 text-sm font-bold text-white"
            >
              {locale === 'nl' ? 'Aanmaken' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Stats table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-700 border-t-brand-accent" />
        </div>
      ) : ads.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-12 text-center">
          <p className="text-surface-400">{locale === 'nl' ? 'Nog geen advertenties' : 'No ads yet'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium text-surface-400">Title</th>
                <th className="px-4 py-3 font-medium text-surface-400">Placement</th>
                <th className="px-4 py-3 font-medium text-surface-400">Impressions</th>
                <th className="px-4 py-3 font-medium text-surface-400">Clicks</th>
                <th className="px-4 py-3 font-medium text-surface-400">CTR</th>
                <th className="px-4 py-3 font-medium text-surface-400">Status</th>
                <th className="px-4 py-3 font-medium text-surface-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{ad.title}</td>
                  <td className="px-4 py-3 text-surface-400">{ad.placement}</td>
                  <td className="px-4 py-3 text-surface-300">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-surface-300">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-brand-accent font-medium">{ad.ctr}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ad.isActive ? 'bg-green-500/15 text-green-400' : 'bg-surface-700 text-surface-500'}`}>
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ad.isActive && (
                      <button onClick={() => handleDeactivate(ad.id)} className="text-xs text-red-400 hover:text-red-300">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Listing Performance Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white">{locale === 'nl' ? 'Tip: Verhoog uw zichtbaarheid' : 'Tip: Boost your visibility'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-brand-accent">Featured</p>
            <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Bovenaan in resultaten' : 'Top of search results'}</p>
            <p className="mt-2 text-sm font-medium text-white">€49/maand</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-brand-accent">Verified</p>
            <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Vertrouwensbadge op al uw auto\'s' : 'Trust badge on all your cars'}</p>
            <p className="mt-2 text-sm font-medium text-white">€29/maand</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-brand-accent">Boost</p>
            <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Individuele auto boosten' : 'Boost individual listings'}</p>
            <p className="mt-2 text-sm font-medium text-white">€9/auto</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics (requires location) */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
        <h2 className="text-lg font-bold text-white">{locale === 'nl' ? '📊 Performance' : '📊 Performance'}</h2>
        <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Voer uw locatie in om prestaties te bekijken' : 'Enter your location to view performance'}</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={locale === 'nl' ? 'Uw stad (bijv. Amsterdam)' : 'Your city (e.g., Amsterdam)'}
            className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
            id="dealer-location"
          />
          <button
            onClick={async () => {
              const loc = (document.getElementById('dealer-location') as HTMLInputElement)?.value;
              if (!loc) return;
              try {
                const res = await fetch(`${API_BASE}/dealer/performance?location=${encodeURIComponent(loc)}`);
                if (res.ok) {
                  const data = await res.json();
                  alert(`📊 ${loc}:\n• ${data.dealer.listingCount} listings\n• ${data.dealer.totalViews} views total\n• ${data.dealer.avgViewsPerListing} views/listing\n• Platform avg: ${data.platform.avgViewsPerListing} views/listing\n• Performance: ${data.performance.viewsVsPlatform > 0 ? '+' : ''}${data.performance.viewsVsPlatform}% vs platform\n• Rating: ${data.dealer.rating}/5 (${data.dealer.ratingCount} reviews)`);
                }
              } catch { /* ignore */ }
            }}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white"
          >
            {locale === 'nl' ? 'Bekijk' : 'View'}
          </button>
        </div>
      </div>

      {/* Inventory Sync */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
        <h2 className="text-lg font-bold text-white">{locale === 'nl' ? '🚗 Inventaris' : '🚗 Inventory'}</h2>
        <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Bekijk uw actieve auto\'s en hun weergaven' : 'View your active listings and their views'}</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={locale === 'nl' ? 'Uw stad (bijv. Amsterdam)' : 'Your city (e.g., Amsterdam)'}
            className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
            id="dealer-inventory-location"
          />
          <button
            onClick={async () => {
              const loc = (document.getElementById('dealer-inventory-location') as HTMLInputElement)?.value;
              if (!loc) return;
              try {
                const res = await fetch(`${API_BASE}/dealer/inventory?location=${encodeURIComponent(loc)}`);
                if (res.ok) {
                  const data = await res.json();
                  const lines = data.listings.slice(0, 10).map((l: { title: string; price: number; views: number }) =>
                    `• ${l.title} — €${l.price.toLocaleString()} (${l.views} views)`
                  );
                  alert(`🚗 ${loc} — ${data.totalListings} listings:\n${lines.join('\n')}${data.totalListings > 10 ? `\n...+${data.totalListings - 10} more` : ''}`);
                }
              } catch { /* ignore */ }
            }}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white"
          >
            {locale === 'nl' ? 'Laden' : 'Load'}
          </button>
        </div>
      </div>

      {/* Review Management */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
        <h2 className="text-lg font-bold text-white">{locale === 'nl' ? '⭐ Reviews' : '⭐ Reviews'}</h2>
        <p className="mt-1 text-xs text-surface-400">{locale === 'nl' ? 'Bekijk klantbeoordelingen voor uw locatie' : 'View customer reviews for your location'}</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={locale === 'nl' ? 'Uw stad (bijv. Amsterdam)' : 'Your city (e.g., Amsterdam)'}
            className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-accent/50"
            id="dealer-reviews-location"
          />
          <button
            onClick={async () => {
              const loc = (document.getElementById('dealer-reviews-location') as HTMLInputElement)?.value;
              if (!loc) return;
              try {
                const res = await fetch(`${API_BASE}/dealer/reviews?location=${encodeURIComponent(loc)}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.reviews.length === 0) {
                    alert(locale === 'nl' ? 'Nog geen reviews voor deze locatie.' : 'No reviews for this location yet.');
                    return;
                  }
                  const lines = data.reviews.slice(0, 10).map((r: { rating: number; comment: string | null; date: string }) =>
                    `${'⭐'.repeat(r.rating)} ${r.comment || (locale === 'nl' ? '(geen opmerking)' : '(no comment)')}`
                  );
                  alert(`⭐ Reviews (${data.reviews.length}):\n${lines.join('\n')}`);
                }
              } catch { /* ignore */ }
            }}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white"
          >
            {locale === 'nl' ? 'Laden' : 'Load'}
          </button>
        </div>
      </div>
    </div>
  );
}
