'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  readonly?: boolean;
}

export default function LocationMap({
  latitude,
  longitude,
  onLocationChange,
  height = '200px',
  readonly = true,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet from CDN if not already loaded
    const loadLeaflet = () => {
      if ((window as any).L) {
        setIsLoaded(true);
        return true;
      }

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!document.querySelector('script[src*="leaflet"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
      } else {
        setIsLoaded(true);
      }

      return false;
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !containerRef.current) return;

    const L = (window as any).L;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([latitude, longitude], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add marker with custom icon
      const icon = L.icon({
        iconUrl: '/albero.svg',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      markerRef.current = L.marker([latitude, longitude], { icon })
        .addTo(mapRef.current)
        .bindPopup('La tua posizione');

      // Handle click if not readonly
      if (!readonly && onLocationChange) {
        mapRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
          onLocationChange(lat, lng);
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update marker position when coords change
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([latitude, longitude], 14);
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: '0.75rem', overflow: 'hidden' }}
      className="border border-gray-200"
    />
  );
}
