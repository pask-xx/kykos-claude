# KYKOS

> *"Non sappia la destra cosa fa la sinistra"* — piattaforma di donazione anonima dove chi dona non sa chi riceve, e chi riceve non sa chi dona.

KYKOS è una piattaforma charity basata su Next.js che mette in contatto **donatori** e **riceventi** attraverso **enti abilitati** (Caritas, parrocchie, associazioni), preservando la dignità di entrambi con l'anonimato. Gli enti fanno da intermediari fisici: gestiscono la logistica, validano le richieste, certificano lo stato di bisogno. Il pagamento simbolico (1-2€) all'ente al momento del ritiro preserva la dignità del ricevente.

Vedi [MANIFESTO.md](./MANIFESTO.md) per i principi fondanti, [ARCHITECTURE.md](./ARCHITECTURE.md) per l'architettura tecnica.

---

## Stato corrente

**Pre-pilota**, in attesa di test utenti reali (DONOR, RECIPIENT, OPERATOR office + street). Audit completo in [REFACTOR-AUDIT.md](./REFACTOR-AUDIT.md), storico modifiche in [CHANGELOG.md](./CHANGELOG.md), istruzioni operative per i tester in [docs/PILOT-RUNBOOK.md](./docs/PILOT-RUNBOOK.md), setup del sistema di versionamento documenti legali in [docs/LEGAL-DOCUMENTS-SETUP.md](./docs/LEGAL-DOCUMENTS-SETUP.md).

---

## Prerequisiti

- **Node.js ≥ 22** (richiesto da `file-type`)
- **npm** (incluso con Node)
- Account **Supabase** (PostgreSQL + Storage)
- Account **Vercel** (per il deploy)
- Provider email (es. **Resend**) per le notifiche

---

## Installazione

```bash
# 1. Clona il repository
git clone https://github.com/pask-xx/kykos-claude.git
cd kykos

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente (vedi sezione sotto)
cp .env.example .env.local  # oppure crea .env.local a mano

# 4. Genera il client Prisma
npm run db:generate

# 5. Applica le migration al database
npx prisma migrate deploy

# 6. (Opzionale) Popola il database con dati di test
npm run db:seed

# 7. Avvia il dev server
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

---

## Variabili d'ambiente

Crea un file `.env.local` nella root con le seguenti variabili:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase Storage + Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_SERVICE_KEY="eyJ..." # service_role key, MAI esporre al client

# JWT per le sessioni utente
# Genera con: openssl rand -base64 32
JWT_SECRET="almeno-32-caratteri-randomici"

# Email provider (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="KYKOS <noreply@kykos.it>"
```

**Importante**: `JWT_SECRET` è obbligatorio — l'app fallirà all'avvio se mancante (è un assert intenzionale, vedi [CONTRIBUTING.md](./CONTRIBUTING.md) per il perché). Genera una chiave robusta con `openssl rand -base64 32`.

Per il setup email dettagliato vedi [docs/email-setup.md](./docs/email-setup.md).

---

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia il dev server con hot reload su `localhost:3000` |
| `npm run build` | Genera Prisma client + build di produzione |
| `npm start` | Avvia il build di produzione (richiede `npm run build` prima) |
| `npm run lint` | Esegue ESLint su tutto il progetto |
| `npm test` | Avvia Vitest in watch mode (sviluppo) |
| `npm run test:run` | Esegue la suite di test una volta (CI, pre-commit) |
| `npx tsc --noEmit` | Type check senza generare file (pre-commit) |
| `npm run db:generate` | Genera il client Prisma (dopo modifiche a `schema.prisma`) |
| `npm run db:push` | Sincronizza lo schema con il DB (dev only, non production) |
| `npm run db:migrate` | Applica le migration al DB (production) |
| `npm run db:seed` | Popola il DB con dati di test |
| `npm run db:studio` | Apre Prisma Studio (GUI per il DB) |

---

## Documentazione

- **[MANIFESTO.md](./MANIFESTO.md)** — Principi fondanti del progetto
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Architettura tecnica, stack, ruoli
- **[REFACTOR-AUDIT.md](./REFACTOR-AUDIT.md)** — Audit pre-pilota completo (12 interventi)
- **[CHANGELOG.md](./CHANGELOG.md)** — Storico delle modifiche pre-pilota
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Come contribuire, pattern di codice, anti-pattern vietati
- **[TODO.md](./TODO.md)** — Roadmap feature
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Deploy su Vercel
- **[docs/PILOT-RUNBOOK.md](./docs/PILOT-RUNBOOK.md)** — Istruzioni operative per i tester del pilota
- **[docs/email-setup.md](./docs/email-setup.md)** — Configurazione email provider
- **[docs/cost-analysis-5000-users.md](./docs/cost-analysis-5000-users.md)** — Analisi costi a regime
- **[CLAUDE.md](./CLAUDE.md)** — Istruzioni operative per Claude Code

---

## Stack tecnologico

- **Next.js 16** (App Router, Server Components)
- **Prisma 5** + PostgreSQL (Supabase)
- **Supabase Auth + Storage** (per file upload e autenticazione server-side)
- **Tailwind CSS** (styling)
- **Vercel** (hosting)
- **Vitest** (testing)
- **TypeScript** (strict mode)

---

## Licenza

Proprietario. Tutti i diritti riservati.
