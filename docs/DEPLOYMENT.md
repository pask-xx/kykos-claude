# KYKOS - Guida Deployment e DNS

## Configurazione DNS

### Dominio: www.kykos.it

Per collegare il dominio a Vercel, configura sul tuo registrar DNS:

#### Opzione 1: Redirect (consigliata per dominio singolo)
```
Tipo    Nome    Valore
A       @       76.76.21.21
CNAME   www     [your-project].vercel.app
```

#### Opzione 2: Subdomain dedicato (se vuoi staging.kykos.it)
```
Tipo    Nome    Valore
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
CNAME   staging [your-project].vercel.app
```

### Verifica propagazione DNS
```bash
# Controlla configurazione DNS
dig www.kykos.it CNAME
dig kykos.it A

# Verifica con nslookup
nslookup www.kykos.it
```

---

## Workflow di Deploy

### Ambiente Vercel

| Branch | URL Preview | Dominio | Tipo |
|--------|-------------|---------|------|
| `main` | - | kykos.app | Produzione |
| `staging` | - | staging.kykos.app | Collaudo |
| `feature/*` | *.vercel.app | - | Preview |

### Ciclo di sviluppo

```
feature/xyz → PR → Preview URL automatico
    ↓ (approvazione)
merge su staging → Deploy su staging.kykos.app
    ↓ (verifica manuale)
merge su main → Deploy su kykos.app (produzione)
```

---

## Comandi Vercel CLI

### Setup iniziale
```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Collega progetto esistente
vercel link

# Pull environment variables
vercel env pull .env.staging
```

### Deploy
```bash
# Deploy su preview (automatico per ogni PR)
vercel

# Deploy su staging
vercel --prod --token [TEAM_TOKEN]

# Deploy produzione da main
vercel --prod
```

### Environment Variables
```bash
# Lista variabili
vercel env ls

# Aggiungi variabile
vercel env add DATABASE_URL

# Rimuovi variabile
vercel env rm NODE_ENV

# Pull da produzione
vercel env pull .env.production
```

---

## Configurazione Dominio su Vercel

### Via Dashboard
1. Vai su [vercel.com/dashboard](https://vercel.com/dashboard)
2. Seleziona progetto KYKOS
3. Settings → Domains → Add Domain
4. Inserisci `kykos.it` e `www.kykos.it`
5. Copia i valori DNS da mostrare
6. Attendi verifica (5-30 minuti)

### Via CLI
```bash
vercel domains add kykos.it
vercel domains add www.kykos.it
```

---

## Branch e Preview Deployment

### Abilitare Preview per tutti i branch
Project Settings → Git → Preview Deployment Per Branch: **Enabled**

### Configurare dominio staging
1. Project Settings → Domains
2. Aggiungi `staging.kykos.app`
3. In Git → Builds & Deployments:
   - Production Branch: `main`
   - Preview Branch: `staging`
4. Deploy automatico sudominio quando push su branch

---

## Environment Variables necessarie

### Produzione
```
DATABASE_URL=postgres://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://kykos.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Staging (valori distinti)
```
DATABASE_URL=postgres://... (staging db)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://staging.kykos.app
GOOGLE_CLIENT_ID=... (staging OAuth app)
GOOGLE_CLIENT_SECRET=...
```

---

## Procedura rilascio produzione

### 1. Verifica su staging
```bash
# Deploy su staging
git checkout staging
git merge feature/xyz
git push origin staging

# Verifica su https://staging.kykos.app
# - Funzionalità principali
# - SEO (title, meta, structured data)
# - Performance
```

### 2. Merge in produzione
```bash
# Solo dopo approvazione staging
git checkout main
git merge staging
git push origin main

# Vercel deploya automaticamente
```

### 3. Rollback (se necessario)
```bash
# Da Vercel Dashboard
# Deployments → Trova last stable → "..." → "Promote to Production"

# Oppure via CLI
vercel rollback [deployment-id]
```

---

## Checklist pre-produzione

- [ ] Test su staging.kykos.app
- [ ] Verifica metadata SEO (title, description, OG)
- [ ] Verifica robots.txt e sitemap.xml
- [ ] Check performance (Lighthouse > 90)
- [ ] Test mobile responsiveness
- [ ] Verifica redirect DNS propagati
- [ ] Database migrations applicate
- [ ] Environment variables configurate

---

## Troubleshooting

### DNS non propagato
```bash
# Attendi fino a 48h (normally 5-30 min)
# Verifica con
nslookup www.kykos.it 8.8.8.8
```

### SSL certificate problem
- Vercel genera automaticamente certificati
- Se dominio non verificato: Project Settings → Domains → Verify

### Build failed
```bash
# Vedi log
vercel logs [project-name]

# Rebuild locale
vercel --prod --force
```

---

## Database Migrations

### Workflow KYKOS: migrations SOLO manuali

Le migrations Prisma in KYKOS **NON vengono applicate automaticamente** al DB Vercel. Vanno applicate **manualmente** dall'utente via Supabase SQL Editor prima del prossimo deploy.

**Perché workflow manuale**:
- Le migrations 001-009 storiche sono state applicate via script SQL custom (es. `scripts/goods-request-migration.sql`), mai tramite `prisma migrate deploy`. Il DB Supabase NON ha la tabella `_prisma_migrations`.
- Le migrations 010+ seguono lo stesso pattern: file in `prisma/migrations/`, applicazione manuale via SQL.
- Prendere il comando di applicazione automatico (es. `prebuild: prisma migrate deploy`) su un DB senza `_prisma_migrations` rischia di rompere il deploy (Prisma tenta di applicare TUTTE le migrations 001-009 e fallisce su tabelle già esistenti).

### Quando serve applicare manualmente una migration

Quando una route in produzione fallisce con errore tipo:

```
POST /api/operator/login error: Error [PrismaClientKnownRequestError]:
Invalid `prisma.operator.findFirst()` invocation:
The column `organizations.hours_info` does not exist in the current database.
```

significa che la migration NON è ancora stata applicata al DB. Serve applicarla **manualmente** sul DB Supabase PRIMA del prossimo deploy.

### Procedura standard via Supabase SQL Editor

1. Apri Supabase Dashboard → progetto KYKOS → SQL Editor
2. Apri il file della migration in `prisma/migrations/NNN_*/migration.sql`
3. Copia il contenuto (le migrations KYKOS sono idempotenti con blocchi `DO $$ ... $$`)
4. Esegui nel SQL Editor
5. Verifica: nel SQL Editor esegui
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='organizations' AND column_name='hours_info';
   ```
   Deve ritornare 1 riga.

### Procedura standard via psql

```bash
# Con DATABASE_URL da .env.staging o .env.production
psql "$DATABASE_URL" -f prisma/migrations/010_add_org_hours_info/migration.sql
psql "$DATABASE_URL" -f prisma/migrations/011_add_deposit_columns/migration.sql
```

### Script di emergenza pre-generati in `scripts/sql/`

Per interventi comuni, ci sono script SQL pronti all'uso in `scripts/sql/`:

| Script | Quando usarlo |
|--------|---------------|
| `scripts/sql/012_baseline_existing_db.sql` | Se decidi di iniziare a usare `prisma migrate deploy`, marchia le migrations 001-011 come già applicate nella tabella `_prisma_migrations`. Vedi commento header dello script. |

### Verifica migrations applicate

```sql
-- Mostra tutte le migrations applicate (gestite da Prisma)
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY started_at DESC;
```

### Lezione operativa (16 giu 2026)

Prima di questo fix, ogni nuova colonna aggiunta a `schema.prisma` senza creare una migration dedicata causava 500 a runtime in produzione. Le migrations sono IDEMPOTENTI e SICURE: applicarle è SEMPRE meglio che non applicarle.

Regola ferrea KYKOS: **OGNI campo nuovo aggiunto a `schema.prisma` DEVE avere una migration dedicata** committata in `prisma/migrations/`. Vedi [[05-known-issues]] in `memory/` per la lista completa delle colonne aggiunte retroattivamente.

---

## Contatti e riferimenti

- Vercel Dashboard: https://vercel.com/dashboard
- Documentazione: https://vercel.com/docs
- Supporto: support@vercel.com