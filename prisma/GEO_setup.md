# Database Setup - Geolocalizzazione

## Abilitare PostGIS (consigliato per query geografiche avanzate)

Su Supabase Dashboard > SQL Editor, eseguire:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Campi latitude/longitude aggiunti

### Schema Prisma - Modifiche

**User model** - aggiunto `latitude` e `longitude`:
```prisma
latitude     Float?
longitude    Float?
```

**Organization model** - aggiunto `latitude` e `longitude`:
```prisma
latitude      Float?
longitude     Float?
```

### Eseguire la migrazione sul database

Dopo aver aggiornato lo schema Prisma, eseguire la migrazione:

```bash
npx prisma migrate deploy
```

Oppure manualmente via Supabase Dashboard > SQL Editor:

```sql
-- Add lat/lng to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add lat/lng to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
```

## Google Geocoding API Setup

1. Ottenere API key da [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Abilitare **Geocoding API**
3. Aggiungere al file `.env`:
   ```
   GOOGLE_GEOCODING_API_KEY=your-api-key
   ```

## Query geografiche di esempio

### Trovare oggetti nel raggio di 10km da un punto

```sql
-- Using PostGIS
SELECT o.* FROM objects o
JOIN organizations org ON o.intermediary_id = org.id
WHERE ST_DWithin(
  org.location::geography,
  ST_MakePoint($lon, $lat)::geography,
  10000  -- 10km in meters
);

-- Using Haversine formula (app level)
SELECT o.* FROM objects o
JOIN organizations org ON o.intermediary_id = org.id
WHERE (
  6371 * acos(
    cos(radians($lat)) * cos(radians(org.latitude)) *
    cos(radians(org.longitude) - radians($lon)) +
    sin(radians($lat)) * sin(radians(org.latitude))
  )
) <= 10;
```

## Frontend - Browse con geolocalizzazione

Il browse page (`src/app/browse/page.tsx`) supporta ora:
- Richiesta permesso geolocalizzazione browser
- Fallback input città manuale
- Slider raggio: 5km / 10km / 25km / 50km
- Distanza mostrata su ogni card oggetto
