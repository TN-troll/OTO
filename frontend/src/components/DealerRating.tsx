import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../i18n';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getDeviceToken(): string {
  return localStorage.getItem('oto-device-token') || '';
}

interface DealerRatingProps {
  location: string;
  sellerType: string;
}

export function DealerRating({ location, sellerType }: DealerRatingProps) {
  const { locale } = useLanguage();
  const queryClient = useQueryClient();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const { data } = useQuery({
    queryKey: ['dealer-rating', location, sellerType],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ratings?location=${encodeURIComponent(location)}&type=${sellerType}`);
      return res.ok ? res.json() : { averageRating: 0, totalRatings: 0 };
    },
  });

  const mutation = useMutation({
    mutationFn: async (rating: number) => {
      await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': getDeviceToken() },
        body: JSON.stringify({ location, sellerType, rating }),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['dealer-rating', location, sellerType] });
    },
  });

  const avg = data?.averageRating ?? 0;
  const count = data?.totalRatings ?? 0;

  return (
    <div className="flex items-center gap-3">
      {/* Average rating display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= Math.round(avg) ? 'text-yellow-400' : 'text-surface-300 dark:text-surface-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-xs text-surface-500 dark:text-surface-400">
          {avg > 0 ? avg.toFixed(1) : '—'} ({count})
        </span>
      </div>

      {/* Rate this dealer */}
      {!submitted && (
        <div className="flex items-center gap-1 border-l border-surface-200 pl-3 dark:border-surface-700">
          <span className="text-[10px] text-surface-400 mr-1">{locale === 'nl' ? 'Beoordeel:' : 'Rate:'}</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => { setSelectedRating(star); mutation.mutate(star); }}
              className="p-0.5"
              aria-label={`Rate ${star} stars`}
            >
              <svg
                className={`h-4 w-4 transition-colors ${
                  star <= (hoveredStar || selectedRating) ? 'text-yellow-400' : 'text-surface-300 dark:text-surface-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      )}
      {submitted && (
        <span className="text-[10px] text-green-500 dark:text-green-400">✓ {locale === 'nl' ? 'Bedankt!' : 'Thanks!'}</span>
      )}
    </div>
  );
}
