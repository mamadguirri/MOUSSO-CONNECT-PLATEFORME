"use client";

import { useState, useCallback, useEffect } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  coords: GeoPosition | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
  requestLocation: () => void;
}

const CACHE_KEY = "musso_geo_coords";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getCachedCoords(): GeoPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { coords, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return coords;
  } catch {
    return null;
  }
}

function setCachedCoords(coords: GeoPosition) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ coords, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  // Vérifier le support et charger depuis le cache au montage (côté client uniquement)
  useEffect(() => {
    setSupported("geolocation" in navigator);
    const cached = getCachedCoords();
    if (cached) {
      setCoords(cached);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!supported) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    // Vérifier le cache d'abord
    const cached = getCachedCoords();
    if (cached) {
      setCoords(cached);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(newCoords);
        setCachedCoords(newCoords);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Veuillez autoriser l'accès à votre position dans les paramètres de votre navigateur");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Position indisponible. Vérifiez que le GPS est activé");
            break;
          case err.TIMEOUT:
            setError("Délai d'attente dépassé. Réessayez");
            break;
          default:
            setError("Impossible d'obtenir votre position");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      }
    );
  }, [supported]);

  return { coords, loading, error, supported, requestLocation };
}
