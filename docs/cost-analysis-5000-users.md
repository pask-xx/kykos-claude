# KYKOS — Stima Costi Sperimentazione 5000 Utenti (uso intenso)

## Legenda acronimi

| Acronimo | Significato | Definizione |
|---|---|---|
| **MAU** | Monthly Active Users | Utenti unici che hanno effettuato almeno un'azione autenticata nel mese. Metrica principale di billing per Supabase Auth e per la capacità DB. |
| **DAU** | Daily Active Users | Utenti unici attivi in una singola giornata. Tipicamente il 20-40% dei MAU per app di servizio. |
| **CDN** | Content Delivery Network | Rete di server distribuiti geograficamente che cacha e serve contenuti statici vicino all'utente finale. Vercel ha CDN integrata (Edge Network). |
| **Edge Request** | Richiesta processata dalla CDN | Ogni hit al CDN conta, anche se servito da cache. Vercel: 10M inclusi nel Pro plan, poi $2-3.20 per 1M. |
| **Fast Data Transfer** | Dati CDN → utente finale | Banda in uscita dal CDN verso il browser/dispositivo dell'utente. Vercel: 1 TB incluso, poi $0.15-0.35/GB. |
| **Fast Origin Transfer** | Dati CDN → Vercel Function | Banda tra il CDN (cache miss) e la Function serverless che genera la risposta. Vercel: $0.06-0.43/GB, MAI gratis. |
| **Fluid Compute** | Modello Vercel post-2026 | Esegue Vercel Functions con riuso delle istanze tra richieste concorrenti (no cold start continui). Default per tutti i nuovi progetti. Fattura 3 metriche: Active CPU (tempo CPU attivo, esclude I/O), Provisioned Memory (per tutta la vita dell'istanza, incluso I/O), Invocations (per richiesta HTTP). |
| **Active CPU** | Tempo CPU attivo | Fatturato in $/ora-region. KYKOS in fra1 (Francoforte): $0.184/h. Il tempo speso in attesa I/O (es. query DB) NON è fatturato come CPU. |
| **Provisioned Memory** | RAM allocata all'istanza Function | Fatturata in $/GB-ora per TUTTA la vita dell'istanza, anche durante I/O. KYKOS in fra1: $0.0152/GB-h. |
| **Invocation** | Singola richiesta HTTP alla Function | Vercel: $0.60 per 1M. Diverso da Edge Request (che include anche asset statici e cache hits). |
| **ISR** | Incremental Static Regeneration | Tecnica Next.js: rigenera pagine statiche on-demand dopo la prima build. Addebita Reads + Writes sul Vercel Data Cache. |
| **DB Compute** | Istanza PostgreSQL Supabase | Macchina virtuale che esegue il database. Dimensionata per CPU/RAM. Fatturata in $/mese per "size" (Nano/Micro/Small/Medium/Large/XL/...). |
| **Egress** | Dati in uscita da Supabase | Banda scaricata dal DB/Storage verso internet. Inclusa nel piano Pro: 250 GB/mese, poi $0.09/GB. |
| **MAU Auth (Supabase)** | Monthly Active Users Auth | Utenti unici che hanno effettuato login/refresh token Supabase Auth nel mese. Pro: 100k inclusi, poi $0.00325/MAU. |
| **PITR** | Point-in-Time Recovery | Backup continuo del database che permette restore a un timestamp preciso (es. "ripristina alle 14:32 di ieri"). Add-on Supabase: $100/mese per 7 giorni retention. |
| **Log Drains** | Esportazione log verso servizi esterni | Stream di log applicativi inviato a Better Stack / Datadog / Vercel Observability. Supabase: $60/drain/mese + costi per eventi. |
| **SWR** | Stale-While-Revalidate | Pattern di caching client-side (usato da Vercel per `useSWR` di Next.js): mostra dati cached, poi rivalida in background. Riduce chiamate API ripetute. |
| **AVIF / WebP** | Formati immagine moderni | Compressione superiore a JPEG/PNG (30-50% più leggeri). Supportati nativamente da browser moderni. `next/image` li serve automaticamente. |
| **Edge Request CPU Duration** | Tempo di calcolo per Edge Request | Tempo CPU speso dal CDN per processare la richiesta (routing, redirect, regex). Primi 10ms gratis, poi $0.30-0.48/h in step di 10ms. |
| **Image Optimization** | Trasformazione on-the-fly di immagini | Vercel ridimensiona, comprime e converte (AVIF/WebP) immagini servite da `next/image`. Fatturata in 3 metriche: Trasformazioni (cache miss), Cache Reads, Cache Writes. |

---

## Premessa

Questa analisi stima i **costi mensili ricorrenti** per un'app KYKOS con **5.000 utenti attivi** in regime di **uso intenso** (utenti che usano KYKOS come canale principale di donazione/richiesta, non come servizio occasionale). Pricing aggiornato a luglio 2026.

### Ipotesi di carico (uso importante)

| Parametro | Valore | Note |
|---|---|---|
| **MAU** | 5.000 | 5k utenti autenticati attivi nel mese |
| **DAU** | ~1.500 (30% dei MAU) | 1 utente su 3 apre l'app ogni giorno |
| **Sessioni/utente/giorno** | 3 (DAU) | Dashboard + browse oggetti + azione |
| **API call/utente/giorno** | 40 (DAU) | Liste, filtri, mutations, refresh SWR |
| **Oggetti pubblicati totali** | 80.000 | 16 per donatore attivo (~3.000 donatori) |
| **Nuovi oggetti/mese** | ~5.000 | 1.7 al giorno per donatore, turnover realistico |
| **Richieste/mese** | ~2.500 | 1 ogni 2 utenti attivi al mese |
| **Notifiche email** | 15.000/mese | ~30% delle azioni generano email (richieste, match, QR, password reset, legali) |
| **Foto caricate/mese** | 6.000 | 1.2 foto per nuovo oggetto (alcuni donatori ne caricano più d'una) |
| **Foto servite/mese** | 1.500.000 | 5.000 oggetti × 30 visualizzazioni medie (browse dettaglio + thumbnail) |
| **Storage foto totale** | ~25 GB | Crescita progressiva (foto 200-500KB WebP) |
| **DB size** | ~4 GB | Tabelle user/object/request/donation/notifiche |
| **DB query/utente/giorno** | 50 (DAU) | Liste, count, join su tabelle grosse |
| **Realtime/notifiche in-app** | 8.000/mese | Canale Supabase per notifiche push in-app |

### Regioni assunte
- **Vercel**: `fra1` (Frankfurt, EU) — hosting tipico per utenti italiani
- **Supabase**: `eu-west-1` (Irlanda) — più vicino all'Italia nel piano Pro
- Tasso di cambio: $1 = €0.92 (arrotondato per semplicità)

---

## Vercel — Pro Plan

**Piano**: Pro ($20/mese, include $20 di usage credit + 1 deploying seat)
**Regione primaria**: fra1 (Frankfurt) — `Active CPU $0.184/h, Memory $0.0152/GB-h`

### Metriche di costo 2026

Le metriche storiche (Edge Requests, ISR) sono ancora fatturate ma **non sono più** il driver principale. Il costo reale oggi dipende da:

| Risorsa | Incluso (Pro) | Overage |
|---|---|---|
| **Fast Data Transfer** (bandwidth CDN→utente) | 1 TB/mese | $0.15–$0.35/GB (regione-dipendente) |
| **Fast Origin Transfer** (CDN→Function/DB) | non incluso | $0.06–$0.43/GB |
| **CDN/Edge Requests** | 10M/mese | $2.00–$3.20 per 1M |
| **Fluid Compute — Active CPU** | coperto da credit | $0.184/h in fra1 (solo tempo CPU attivo, no I/O) |
| **Fluid Compute — Provisioned Memory** | coperto da credit | $0.0152/GB-h in fra1 (per tutta la vita dell'istanza) |
| **Fluid Compute — Invocations** | coperto da credit | $0.60 per 1M (riusata nella tabella) |
| **Edge Request CPU Duration** | primi 10ms gratis | $0.30–$0.48/h in step di 10ms |
| **Image Optimization — Trasformazioni** | 5K/mese (Hobby) | $0.05–$0.0812 per 1K |
| **Image Optimization — Cache Reads** | 300K/mese (Hobby) | $0.40–$0.64 per 1M |
| **Image Optimization — Cache Writes** | 100K/mese (Hobby) | $4.00–$6.40 per 1M |

**Nota Fluid Compute**: una Function con 1 GB di memoria che resta attiva 5 secondi totali (con 200ms di CPU attivo e 4.8s di attesa I/O) costa: CPU `0.0002h × $0.184 = $0.000037` + Memory `0.0014 GB-h × $0.0152 = $0.0000212` = **~$0.00006 per invocazione**.

### Calcolo per KYKOS in uso intenso

| Voce | Calcolo | Costo |
|---|---|---|
| **Platform fee Pro** | $20 | **$20.00** |
| **CDN/Edge Requests** | 1.500 DAU × 3 sessioni × 30 gg × 8 richieste/sessione = 1.08M/giorno = **32.4M/mese** → 22.4M oltre i 10M inclusi | $22.4M × $2.50/M ≈ **$56.00** |
| **Fast Data Transfer (CDN→utente)** | HTML/CSS/JS medio 500KB + foto ottimizzate 80KB × 5 visualizzazioni/oggetto/sessione. ~25 GB/mese. Sotto la soglia 1 TB. | **$0** |
| **Fluid Compute — Invocations** | ~1.8M invocations/mese (somma di tutte le Function chiamate) | $1.8M × $0.60/M = **$1.08** |
| **Fluid Compute — Active CPU** | Stima conservativa: 150ms CPU medio per richiesta × 1.8M = 270.000s = 75 ore. Tutto in fra1: 75 × $0.184 | **$13.80** |
| **Fluid Compute — Provisioned Memory** | Function con 1.024 GB memory media, instance alive ~3s per richiesta (incluso retry/cold start). 1.8M × 3s = 5.400.000s = 1.500 ore. 1.500h × 1.024 GB × $0.0152 | **$23.34** |
| **Fast Origin Transfer (CDN→Function)** | 200KB medio response × 1.8M = 360 GB. 360 × $0.20 (stima EU) | **$72.00** |
| **Edge Request CPU Duration** | 50% delle richieste supera 10ms, durata media 80ms = 70ms billed. 32.4M × 70ms = 2.268.000s = 0.63 ore. 0.63 × $0.40 | **$0.25** |
| **Image Optimization** | 5.000 nuove foto ottimizzate/mese (cache writes) + 200.000 cache reads stimate (foto riusate da CDN). Vedi dettaglio sotto. | **~$8.00** |

**Dettaglio Image Optimization**:
- Trasformazioni: 5.000 nuove foto = 5K (sopra i 5K inclusi Hobby, ma Pro ha credit → usiamo credit). Stima $0
- Cache Reads: 200.000 = 0.2M × $0.50/M = **$0.10**
- Cache Writes: 5.000 foto × 2 (mobile + desktop) = 10K = 0.01M × $5/M = **$0.05**
- Fast Data Transfer foto: 1.5M visualizzazioni × 80KB = 120 GB. Foto sono servite via Vercel Image Optimization → contano verso Fast Data Transfer. **Incluso nei 25 GB stimati sopra** (il delta è di 95 GB verso il tetto 1 TB).

**Subtotale Vercel prima del credit**: $20 + $56 + $0 + $1.08 + $13.80 + $23.34 + $72.00 + $0.25 + $8.00 = **$194.47**
**Sottrai Pro usage credit**: -$20.00
**Totale Vercel**: **~$175/mese**

**Aggiungi se abilitati (opzionali)**:
- Web Analytics Plus: $10/mese
- Speed Insights: $10/mese
- Observability Plus: ~$5/mese per ~4M eventi

---

## Supabase — Pro Plan

**Piano**: Pro ($25/mese, include 100k MAU Auth, 8 GB DB, 100 GB file storage, 250 GB egress, 7-day daily backup, 7-day log retention)
**Regione**: eu-west-1 (Irlanda)

### Calcolo per KYKOS in uso intenso

| Voce | Calcolo | Costo |
|---|---|---|
| **Piano base Pro** | $25/mese | **$25.00** |
| **DB Compute — Medium** | 4 GB RAM, 2-core ARM shared, max 100 DB. Con 5k MAU e 50 query/utente/giorno per i DAU (75k query/giorno = ~1 query/sec media, picchi 10-20/sec) → Medium è dimensionamento sicuro. | **$60.00** |
| **DB Storage (oltre 8 GB inclusi)** | 4 GB usati, sotto soglia. | **$0** |
| **Storage file (foto oggetti, profilo, QR, PDF legali)** | 25 GB foto + 0.5 GB PDF/documenti = 25.5 GB. Sotto i 100 GB inclusi. | **$0** |
| **Egress (download da Storage)** | 1.5M visualizzazioni foto × 80KB = 120 GB. Sotto i 250 GB inclusi. | **$0** |
| **Auth MAU** | 5.000 utenti, sotto i 100k inclusi. | **$0** |
| **Edge Functions** | 500k invocations incluse; KYKOS usa route Next.js API + 1 Supabase Edge Function eventuale (es. webhook Resend). Probabilmente 0. | **$0** |
| **Realtime** | 500 connessioni incluse; 1.500 DAU con notifiche in-app: ~200 connessioni realtime concorrenti nei picchi. 5M messaggi inclusi; 8k messaggi/mese stimati. | **$0** |
| **Log Drains (opzionale)** | Se abilitato per observability Vercel: $60/drain + $0.20/M eventi + $0.09/GB egress. Non abilitato di default. | **$0** |
| **PITR (Point-in-Time Recovery)** | Opzionale, +$100/mese per 7 giorni. Per pilota: daily backup 7gg (incluso in Pro) è sufficiente. | **$0** |
| **Custom Domain (opzionale)** | Se auth.kykos.it separato: $10/mese. Per pilota non necessario. | **$0** |

**Subtotale Supabase**: **$85/mese** (Pro $25 + Medium $60)

**Nota su scaling**: se il pilota supera i 5k MAU, il salto di compute potrebbe essere Large ($110, 8 GB RAM, 160/800 connessioni DB) → $135/mese Supabase totale. Monitorare il `pg_stat_activity` per connessioni attive nei picchi.

---

## Resend — Pro Plan

**Piano**: Pro $20/mese (50.000 email incluse) oppure Pro $35/mese (100.000 email incluse)
**Overage**: $0.90 per 1.000 email oltre il tier

### Calcolo per KYKOS in uso intenso

| Voce | Calcolo | Costo |
|---|---|---|
| **Piano base** | 15.000 email/mese sotto la soglia 50k di Pro $20. | **$20.00** |
| **Overage** | Non necessario. | **$0** |

**Subtotale Resend**: **$20/mese**

**Nota**: se in futuro si attivano notifiche digest giornaliere/settimanali, le email possono salire a 50-100k. In tal caso, Pro $35 (100k incluse) è più economico del tier Scale.

---

## Riepilogo Costi Mensili — Scenario Uso Intenso

| Servizio | Costo | Note |
|---|---|---|
| **Vercel Pro** | ~$175 | Dominato da Edge Requests (22.4M oltre inclusi) + Fast Origin Transfer (360 GB) |
| **Supabase Pro + Medium** | $85 | Compute Medium necessario per i picchi di query |
| **Resend Pro** | $20 | 15k email/mese sotto la soglia 50k |
| **TOTALE USD** | **$280/mese** | |
| **TOTALE EUR** (a 0.92) | **~€258/mese** | |

### Costi opzionali / da aggiungere solo se servono
| Add-on | Costo | Quando serve |
|---|---|---|
| Web Analytics Plus (Vercel) | $10 | Solo se si vuole analytics dettagliata UX |
| Speed Insights (Vercel) | $10 | Solo se si vuole monitorare Lighthouse/LCP |
| Observability Plus (Vercel) | $5-15 | Solo se si superano i free traces |
| Supabase Log Drains (verso Better Stack/Datadog) | $60+ | Solo se si vuole observability centralizzata |
| Supabase PITR | $100 | Solo se servono restore point-in-time (per pilota: daily backup basta) |
| Supabase Custom Domain Auth | $10 | Solo se si vuole branding kykos.it su Supabase Auth (vedi `05-known-issues` TODO) |
| Dominio custom (registrar) | ~€10-15/anno | Una tantum |

---

## Confronto con stima precedente (maggio 2026)

| Voce | Vecchia stima | Nuova stima | Δ |
|---|---|---|---|
| Vercel | $20–50 | $175 | +$125–155 |
| Supabase | $85 | $85 | invariato |
| Resend | $0–20 | $20 | invariato |
| **Totale** | **$105–155** | **$280** | **+$125–175** |

**Perché è aumentato Vercel**:
1. **Fast Origin Transfer** (CDN→Function) prima non era una metrica visibile. Con 1.8M invocations × 200KB response = 360 GB/mese, è ora il secondo driver dopo le Edge Requests.
2. **Fluid Compute** addebita la **Provisioned Memory** per tutta la vita dell'istanza (incluso I/O), non solo il CPU attivo. Con 1.5k ore di memory/mese, il costo memory supera quello CPU.
3. Lo scenario "uso intenso" ha **2.5× le Edge Requests** rispetto allo scenario conservativo (32.4M vs 1.5M). Il bundle API più ricco (filtri, SWR refresh, IntersectionObserver) moltiplica le richieste.
4. **Image Optimization** ora è una metrica separata (prima le foto erano servite come asset statici senza passare per il transform).

---

## Raccomandazioni per contenere i costi (aggiornate 2026-07)

1. **Edge Requests** è ora il driver principale Vercel.
   - Implementare cache `Cache-Control: s-maxage` aggressive su route read-only (liste oggetti pubblici)
   - SWR con `dedupingInterval: 60_000` per evitare re-fetch su focus tab
   - Usare `<Link prefetch={false}>` per route non critiche
   - Obiettivo: dimezzare le 32M Edge Requests → risparmio ~$28/mese

2. **Fast Origin Transfer** ($72/mese) è il terzo driver.
   - Comprimere response API con `gzip`/`br` (Vercel lo fa gratis, verificare sia attivo)
   - Select Prisma strettissimo: niente `include` con tabelle grosse
   - Paginazione sempre obbligatoria (mai lista completa su /objects)

3. **Fluid Compute Memory** ($23/mese) si riduce spegnendo le istanze più velocemente.
   - Configurare `maxDuration` corto sulle Function API (es. 10s invece di 300s)
   - Funzioni "fredde" (es. cron) schedulate a orari di basso traffico

4. **Supabase Medium → Small** se i picchi lo permettono.
   - Monitorare `pg_stat_activity` per 2 settimane. Se max connessioni < 70, downgrade a Small ($15) → risparmio $45/mese.

5. **Resend**: nessuna ottimizzazione necessaria, già sotto la soglia free.

6. **Image Optimization**: usare formati moderni (AVIF/WebP) con `next/image` + `formats: ['image/avif', 'image/webp']`. Riduce Cache Writes e Fast Data Transfer.

---

## Scenario a 12 mesi — Proiezione

Se KYKOS cresce linearmente dopo il pilota:

| Fase | MAU | Vercel | Supabase | Resend | Totale USD | Totale EUR |
|---|---|---|---|---|---|---|
| Pilota (mese 1-3) | 5.000 | $175 | $85 | $20 | $280 | €258 |
| Crescita (mese 4-9) | 15.000 | $420 | $135* | $35 | $590 | €543 |
| Consolidamento (mese 10-12) | 30.000 | $780 | $135* | $35 | $950 | €874 |

*Supabase: si presume Large ($110) sopra i 10k MAU; resta invariato in entrambe le fasi successive.

**Break-even del Tier Scale Resend**: sopra 100k email/mese conviene passare al tier Scale ($90/mese per 100k incluse) o affidarsi a un SMTP transactionale tipo Amazon SES ($0.10 per 1k).

**Costo annuale di picco a regime (30k MAU)**: ~$11.400/anno (~$10.500 EUR). Da confrontare con il costo di un operatore umano full-time (anche solo part-time €15-20k/anno lordi) → KYKOS è **conveniente** se gestisce almeno ~500 richieste/mese che altrimenti richiederebbero operatori.

---

## Note finali

- **Prezzi**: aggiornati a luglio 2026 da vercel.com/docs, supabase.com/pricing, resend.com/pricing. Vercel segnala "pricing may be subject to change".
- **Valuta**: $ USD, conversione EUR indicativa a 0.92.
- **Ipotesi pessimistiche**: se le foto non vengono cachate e ogni visualizzazione genera una transform nuova, Image Optimization può arrivare a $30-50/mese. Verificare con il dashboard Vercel Usage dopo 1 settimana di traffico reale.
- **Ipotesi ottimistiche**: se le ottimizzazioni cache (punto 1 sopra) dimezzano le Edge Requests, il totale scende a ~$230/mese.
- **Costo dominio + DNS**: trascurabile (€10-20/anno) ma da mettere a budget.

---

*Documento aggiornato: 2026-07-10. Precedente versione: 2026-05-08 (scenario conservativo, metriche Vercel pre-Fluid Compute).*
