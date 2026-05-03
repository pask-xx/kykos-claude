# KYKOS - Database Scripts

## Scripts Available

### migrations/
| Script | Descrizione |
|--------|-------------|
| `004_add_volunteer_withdrawn_status/migration.sql` | Aggiunge stato WITHDRAWN al enum VolunteerStatus |
| `005_object_status_and_goods_offer_migration.sql` | Rinomina WITHDRAWN->DEPOSITED, aggiunge CANCELLED a ObjectStatus e RequestStatus, nuovo GoodsOfferStatus enum |

### migration.sql
```sql
ALTER TYPE "VolunteerStatus" ADD VALUE 'WITHDRAWN';
```

### rollback_volunteer_withdrawn.sql
Rollback dello stato WITHDRAWN (da usare solo se necessario).

---

## Come eseguire le migrazioni

### Opzione 1: Supabase Dashboard (consigliata)
1. Vai su [supabase.com](https://supabase.com) → progetto KYKOS
2. SQL Editor → nuova query
3. Copia il contenuto di `005_object_status_and_goods_offer_migration.sql`
4. Esegui (F5 o Run)

### Opzione 2: Via psql
```bash
psql "postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f scripts/005_object_status_and_goods_offer_migration.sql
```

### Opzione 3: Via Vercel (se usi Vercel Postgres)
```bash
vercel env pull .env.local
npx prisma db push
```

---

## Verifica dopo migrazione

```sql
-- Verifica ObjectStatus
SELECT enumlabel FROM pg_enum WHERE enumname = 'ObjectStatus';

-- Verifica RequestStatus
SELECT enumlabel FROM pg_enum WHERE enumname = 'RequestStatus';

-- Verifica GoodsOfferStatus
SELECT enumlabel FROM pg_enum WHERE enumname = 'GoodsOfferStatus';

-- Verifica NotificationType
SELECT enumlabel FROM pg_enum WHERE enumname = 'NotificationType';
```

Dovrebbe mostrare:
```
ObjectStatus: AVAILABLE, RESERVED, DEPOSITED, DONATED, CANCELLED
RequestStatus: PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED
GoodsOfferStatus: PENDING, ACCEPTED, REJECTED, CANCELLED
NotificationType: OBJECT_DEPOSITED, OBJECT_CANCELLED
```