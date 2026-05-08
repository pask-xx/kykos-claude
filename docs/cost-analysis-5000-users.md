# KYKOS — Stima Costi Sperimentazione 5000 Utenti

## Premessa

Questa analisi stima i costi mensili per un'app KYKOS con **5000 utenti attivi**, considerando:

- ~100.000 oggetti pubblicati (20 per donatore in media)
- ~10 API calls/utente/giorno
- ~30% delle operazioni genera email di notifica

---

## Vercel

### Pricing rilevante

| Risorsa | First Tier | Overage |
|---------|-----------|---------|
| Edge Requests | 10M inclusi | $2.40 per 1M |
| ISR Reads | incluso | $0.48 per 1M |
| ISR Writes | incluso | $4.80 per 1M |
| Bandwidth | 1TB incluso | $0.15 per GB |

### Calcolo

| Voce | Calcolo | Costo |
|------|---------|-------|
| Edge Requests | 5k utenti × 10 calls × 30gg = 1.5M/mese → tutto coperto | $0 |
| ISR Reads/Writes | caching appropriato, stimate sotto soglia | $0 |
| Bandwidth | ~30GB/mese | ~$2 |

**Totale Vercel: ~$20-50/mese**

---

## Supabase

### Piano Pro base ($25/mese)

Include:

- 100,000 MAU
- 8 GB disk
- 250 GB egress
- 100 GB file storage
- Daily backups (7 giorni)
- 7-day log retention

### Compute Sizes

| Size | Hourly | Mensile | CPU | RAM | Max DB |
|------|--------|---------|-----|-----|--------|
| Nano | $0 | $0 | shared | 0.5 GB | 500 MB |
| Micro | $0.01344 | ~$10 | 2-core shared | 1 GB | 10 GB |
| **Small** | $0.0206 | ~$15 | 2-core shared | 2 GB | 50 GB |
| **Medium** | $0.0822 | ~$60 | 2-core shared | 4 GB | 100 GB |
| Large | $0.1517 | ~$110 | 2-core dedicated | 8 GB | 200 GB |

### Utilizzo stimato con 5k utenti

| Risorsa | Uso | Capacità Piano Pro |
|---------|-----|-------------------|
| MAU | ~5,000 | 100,000 |
| Disk | ~3-4 GB | 8 GB |
| Egress | ~30-50 GB | 250 GB |
| File Storage | ~2-4 GB | 100 GB |

### Scenari overage

| Scenario | Extra |
|----------|-------|
| Egress > 250GB | +$0.09/GB |
| Storage > 100GB | +$0.021/GB |
| MAU > 100k | +$0.00325/MAU |

### Raccomandazione compute

**Per KYKOS: Medium ($60)**

Motivazioni:
- 4GB RAM gestisce ~50-100 connessioni DB contemporanee (5k utenti)
- 100GB DB size per crescita futura
- 2-core condivisi sufficienti per query normali
- Riserva per query analitiche/complexe

**Alternativa budget:** Small ($15) per inizio sperimentazione, upgrade a Medium se rallentamenti.

### Extra (non inclusi)

| Voce | Costo |
|------|-------|
| Log Drains | $60/drain |
| Additional projects | $25 ciascuno |

---

## Resend

### Pricing

- 3,000 email gratuite/mese
- Oltre: $0.015/email

### Calcolo

| Voce | Stima | Costo |
|------|-------|-------|
| Email/mese | ~10k (solo notifiche principali) | $0 (free tier) |
| Scenario heavy | 30k email | ~$0.40 |

**Totale Resend: ~$0-20/mese**

---

## Riepilogo Costi Mensili

| Servizio | Min | Max |
|----------|-----|-----|
| Vercel | $20 | $50 |
| Supabase (Medium) | $85 | $85 |
| Resend | $0 | $20 |
| **Totale** | **$105** | **$155** |

---

## Raccomandazioni per contenere i costi

1. **Caching appropriato** — oggetti pubblicati cambiano raramente, ISR riduce chiamate DB
2. **Query efficienti** — evitare SELECT * su tabelle grandi, indici su field frequenti
3. **Immagini compresse** — QR e avatar ottimizzati (WebP/AVIF dove possibile)
4. **Monitoraggio egress** — evitare API che ritornano dati inutili
5. **Partire con Small** — upgrade a Medium quando necessario

---

## Note

- Prezzi aggiornati a maggio 2026, verificare su pricing page ufficiali
- Vercel: costo reale dipende molto da pattern di utilizzo e caching
- Supabase: se l'app fa uso intensivo di file o query analitiche complesse, costi potrebbero salire
- Stimare picchi: se tutti gli utenti pubblicano contemporaneamente, costi Vercel aumentano

---

*Documento generato: 2026-05-08*