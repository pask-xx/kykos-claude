# Scripts CLI — Setup env per staging/prod

Gli script in `scripts/*.ts` (es. `seed-legal-v1.ts`) leggono `.env` dalla root. Per puntare a staging o produzione, copia il template corrispondente:

```bash
# Per staging
cp .env.staging .env
npx tsx scripts/seed-legal-v1.ts

# Per produzione (⚠️ attenzione: tocca DB reale)
cp .env.production .env
npx tsx scripts/seed-legal-v1.ts
```

## File

| File | Committato? | Contenuto |
|------|-------------|-----------|
| `.env.staging.template` | ✅ Sì | Template con istruzioni per staging |
| `.env.staging` | ❌ No (gitignored) | Env STAGING con segreti veri (lo crei tu) |
| `.env.production.template` | ✅ Sì | Template con istruzioni per produzione |
| `.env.production` | ❌ No (gitignored) | Env PRODUCTION con segreti veri (lo crei tu) |
| `.env` (root) | ❌ No (gitignored) | Quello attivo al momento |

## Flusso consigliato

1. Popola `.env.staging` copiando i valori da Vercel + Supabase Dashboard
2. Per eseguire: `cp .env.staging .env && npx tsx scripts/<script>.ts`
3. Dopo: `cp .env.local .env` (o riavvia con il tuo flow di dev)

## Dove recuperare ogni variabile

### `DATABASE_URL`
- Vercel → progetto KYKOS → Settings → Environment Variables
- Filtra per environment: **Staging** o **Production**
- Copia il valore della riga `DATABASE_URL`

### `NEXT_PUBLIC_SUPABASE_URL`
- Stessa posizione (Vercel → Environment Variables)
- Riga `NEXT_PUBLIC_SUPABASE_URL`, colonna Staging o Production

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Stessa posizione
- Riga `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **NON è su Vercel** — è un segreto separato del progetto Supabase
- Supabase Dashboard → Settings → API → Project API keys
- Copia la riga **service_role** (NON `anon`, NON `service_role` da `legacy`)
- Click "Reveal" se nascosto
- Stesso valore per entrambe le variabili (inconsistenza nel codice, vedi TODO)

### `JWT_SECRET`
- Vercel → Environment Variables
- Riga `JWT_SECRET`

## Sicurezza

- I file `.env.staging` e `.env.production` NON vanno committati (vedi `.gitignore`)
- Se per sbaglio committi una chiave: ruotala SUBITO da Supabase Dashboard
- Non condividere i file via chat/email — sono equivalenti a password di root
