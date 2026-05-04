/**
 * Generate SQL script for seeding Italian geographic data
 *
 * Usage: npx tsx scripts/generate-geo-sql.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const geoDataPath = 'D:/PROGETTI/RESOURCE/GEO/GEO';
const outputPath = 'scripts/007_seed_geo_production.sql';

// Helper to read JSON and strip BOM
const readJson = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content.replace(/^﻿/, ''));
};

interface ProvinceData {
  sigla: string;
  provincia: string;
}

interface CityData {
  istat: string;
  comune: string;
  provincia: string;
}

interface GeoData {
  istat: string;
  lat: string;
  lng: string;
}

interface ProvinceJson {
  Sheet7: ProvinceData[];
}

interface CitiesJson {
  Sheet2: CityData[];
}

interface GeoJson {
  Sheet4: GeoData[];
}

async function generateSql() {
  console.log('📊 Generating SQL seed script for Italian geographic data...\n');

  // Load JSON files
  console.log('📂 Loading JSON files...');

  const provincesData = readJson(
    path.join(geoDataPath, 'italy_provincies.json')
  ) as ProvinceJson;

  const citiesData = readJson(
    path.join(geoDataPath, 'italy_cities.json')
  ) as CitiesJson;

  const geoCoordsData = readJson(
    path.join(geoDataPath, 'italy_geo.json')
  ) as GeoJson;

  console.log(`  - ${provincesData.Sheet7.length} provinces loaded`);
  console.log(`  - ${citiesData.Sheet2.length} cities loaded`);
  console.log(`  - ${geoCoordsData.Sheet4.length} geo coordinates loaded`);

  // Create a map of istat -> coordinates
  const geoMap = new Map<string, { lat: number; lng: number }>();
  for (const geo of geoCoordsData.Sheet4) {
    geoMap.set(geo.istat, {
      lat: parseFloat(geo.lat),
      lng: parseFloat(geo.lng),
    });
  }

  // Get provinces that have cities
  const provincesInCities = new Set<string>();
  for (const city of citiesData.Sheet2) {
    provincesInCities.add(city.provincia);
  }

  // Build SQL
  const lines: string[] = [];

  lines.push('-- =====================================================');
  lines.push('-- KYKOS Geographic Data Seed');
  lines.push('-- Generated from Italy provinces/cities/geo JSON files');
  lines.push('-- =====================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('-- =====================================================');
  lines.push('-- PROVINCES');
  lines.push('-- =====================================================');
  lines.push('');

  // Provinces INSERT statements
  let provinceCount = 0;
  for (const prov of provincesData.Sheet7) {
    // Skip entries without cities or without province name
    if (!prov.sigla || !prov.provincia) continue;
    if (!provincesInCities.has(prov.sigla)) continue;

    const name = prov.provincia.replace(/'/g, "''");
    lines.push(`INSERT INTO "provinces" ("id", "sigla", "name") VALUES (gen_random_uuid()::text, '${prov.sigla}', '${name}');`);
    provinceCount++;
  }

  lines.push('');
  lines.push(`-- Total: ${provinceCount} provinces`);
  lines.push('');
  lines.push('-- =====================================================');
  lines.push('-- COMUNI');
  lines.push('-- =====================================================');
  lines.push('');

  // Comuni INSERT statements
  let comuniCount = 0;
  let withCoords = 0;
  let skipped = 0;

  for (const city of citiesData.Sheet2) {
    if (!city.istat || !city.comune || !city.provincia) {
      skipped++;
      continue;
    }

    if (!provincesInCities.has(city.provincia)) {
      skipped++;
      continue;
    }

    const istat = city.istat;
    const name = (city.comune || '').replace(/'/g, "''");
    const provSigla = city.provincia;

    const coords = geoMap.get(istat);
    let lat = 'NULL';
    let lng = 'NULL';

    if (coords) {
      lat = coords.lat.toFixed(6);
      lng = coords.lng.toFixed(6);
      withCoords++;
    }

    lines.push(`INSERT INTO "comunes" ("id", "istat", "name", "provinceSigla", "latitude", "longitude") VALUES (gen_random_uuid()::text, '${istat}', '${name}', '${provSigla}', ${lat}, ${lng});`);
    comuniCount++;
  }

  lines.push('');
  lines.push(`-- Total: ${comuniCount} comuni, ${withCoords} with coordinates`);
  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  // Write SQL file
  const sql = lines.join('\n');
  fs.writeFileSync(outputPath, sql, 'utf-8');

  console.log(`\n✅ SQL script generated: ${outputPath}`);
  console.log(`   - Provinces: ${provinceCount}`);
  console.log(`   - Comuni: ${comuniCount} (${withCoords} with coordinates, ${skipped} skipped)`);
  console.log(`   - File size: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
}

generateSql().catch(console.error);