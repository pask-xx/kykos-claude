'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Initialize map only once
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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
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
