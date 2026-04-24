'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

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
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const cssLoadedRef = useRef(false);

  useEffect(() => {
    // Load Leaflet CSS from CDN if not already loaded
    if (!cssLoadedRef.current && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      cssLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Wait for CSS to load before initializing map
    const initMap = () => {
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView([latitude, longitude], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Add marker
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
          mapRef.current.on('click', (e) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = L.marker([lat, lng]).addTo(mapRef.current!);
            }
            onLocationChange(lat, lng);
          });
        }
      }
    };

    // Check if Leaflet CSS is loaded
    if (document.querySelector('link[href*="leaflet"]')) {
      initMap();
    } else {
      // Wait a bit for CSS to load
      const timeout = setTimeout(initMap, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

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
