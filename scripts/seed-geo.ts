/**
 * Script to seed Italian provinces and comuni from JSON files
 *
 * Usage: npx tsx scripts/seed-geo.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProvinceData {
  sigla: string;
  provincia: string;
  superficie?: string;
  residenti?: string;
  num_comuni?: string;
  id_regione?: string;
}

interface CityData {
  istat: string;
  comune: string;
  regione: string;
  provincia: string;
  prefisso?: string;
  cod_fisco?: string;
  superficie?: string;
  num_residenti?: string;
}

interface GeoData {
  istat: string;
  comune: string;
  lng: string;
  lat: string;
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

async function seedGeo() {
  console.log('🗺️  SEEDING ITALIAN GEOGRAPHIC DATA');
  console.log('==================================\n');

  // Load JSON files
  const geoDataPath = 'D:/PROGETTI/RESOURCE/GEO/GEO';

  console.log('📂 Loading JSON files...');

  // Helper to read JSON and strip BOM
  const readJson = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Remove BOM if present
    return JSON.parse(content.replace(/^﻿/, ''));
  };

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

  // Get unique provinces from cities (some provinces in the provinces file might not have cities)
  const provincesInCities = new Set<string>();
  for (const city of citiesData.Sheet2) {
    provincesInCities.add(city.provincia);
  }

  console.log(`\n⚠️  Found ${provincesInCities.size} provinces with cities in cities file`);
  console.log(`📊 Provinces file has ${provincesData.Sheet7.length} entries`);

  // Create provinces
  console.log('\n1️⃣  Creating provinces...');
  let provincesCreated = 0;
  let provincesSkipped = 0;

  for (const prov of provincesData.Sheet7) {
    // Check if province has cities
    if (!provincesInCities.has(prov.sigla)) {
      provincesSkipped++;
      continue;
    }

    try {
      await prisma.province.upsert({
        where: { sigla: prov.sigla },
        update: { name: prov.provincia },
        create: {
          sigla: prov.sigla,
          name: prov.provincia,
        },
      });
      provincesCreated++;
    } catch (e) {
      console.error(`  ❌ Error creating province ${prov.sigla}:`, e);
    }
  }

  console.log(`  ✅ Created: ${provincesCreated}`);
  console.log(`  ⏭️  Skipped (no cities): ${provincesSkipped}`);

  // Create comuni
  console.log('\n2️⃣  Creating comuni...');
  let comuniCreated = 0;
  let comuniWithCoords = 0;
  let comuniSkipped = 0;
  let comuniUpdated = 0;

  for (const city of citiesData.Sheet2) {
    // Skip if province doesn't exist
    if (!provincesInCities.has(city.provincia)) {
      comuniSkipped++;
      continue;
    }

    const coords = geoMap.get(city.istat);

    try {
      await prisma.comune.upsert({
        where: { istat: city.istat },
        update: {
          name: city.comune,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
          provinceSigla: city.provincia,
        },
        create: {
          istat: city.istat,
          name: city.comune,
          provinceSigla: city.provincia,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
        },
      });
      comuniCreated++;
      if (coords) comuniWithCoords++;
    } catch (e) {
      console.error(`  ❌ Error creating comune ${city.comune}:`, e);
    }
  }

  console.log(`  ✅ Created: ${comuniCreated}`);
  console.log(`  📍 With coordinates: ${comuniWithCoords}`);
  console.log(`  ⏭️  Skipped (no province): ${comuniSkipped}`);

  // Final counts
  console.log('\n📊 FINAL COUNTS:');
  const finalProvinces = await prisma.province.count();
  const finalComuni = await prisma.comune.count();
  console.log(`  - Provinces: ${finalProvinces}`);
  console.log(`  - Comuni: ${finalComuni}`);

  console.log('\n✅ GEO SEED COMPLETE!');
}

seedGeo()
  .catch((e) => {
    console.error('❌ SEED ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
