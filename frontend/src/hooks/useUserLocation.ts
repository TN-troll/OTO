import { useState, useEffect } from 'react';

const STORAGE_KEY = 'oto-user-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

function getStoredLocation(): UserLocation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

/**
 * Hook that requests user's geolocation (once) and caches it in localStorage.
 * Returns null until permission is granted, then returns { latitude, longitude }.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(getStoredLocation);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (location || denied) return;
    if (!navigator.geolocation) { setDenied(true); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(loc);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch {}
      },
      () => setDenied(true),
      { maximumAge: 86400000, timeout: 10000 } // Cache for 24h
    );
  }, [location, denied]);

  return { userLocation: location, locationDenied: denied };
}

/**
 * Calculate distance in km between two coordinates using Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
