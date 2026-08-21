import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'oto-favorites';
const TOKEN_KEY = 'oto-device-token';
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/** Generate a random device token (64 hex chars) */
function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/** Get or create the device token */
function getDeviceToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token || token.length < 16) {
    token = generateToken();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function getLocalFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getLocalFavorites);
  const [synced, setSynced] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    const token = getDeviceToken();
    fetch(`${API_BASE}/favorites`, {
      headers: { 'X-Device-Token': token },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.favorites) {
          // Merge: backend is source of truth, but include any local-only items
          const local = getLocalFavorites();
          const merged = [...new Set([...data.favorites, ...local])];
          setFavorites(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          
          // Push any local-only items to backend
          const backendSet = new Set(data.favorites as string[]);
          const localOnly = local.filter(id => !backendSet.has(id));
          localOnly.forEach(id => {
            fetch(`${API_BASE}/favorites`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Device-Token': token },
              body: JSON.stringify({ listingId: id }),
            }).catch(() => {});
          });
          
          setSynced(true);
        }
      })
      .catch(() => {
        // Offline — use local only
        setSynced(true);
      });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const token = getDeviceToken();
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Sync with backend (fire and forget)
      if (isFav) {
        fetch(`${API_BASE}/favorites/${id}`, {
          method: 'DELETE',
          headers: { 'X-Device-Token': token },
        }).catch(() => {});
      } else {
        fetch(`${API_BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Token': token },
          body: JSON.stringify({ listingId: id }),
        }).catch(() => {});
      }

      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite, synced };
}
