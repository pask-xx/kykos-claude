# KYKOS — Guida Sessione Claude Code

## Leggi Prima: Memorie di Sessione

Le memorie sono file `.md` caricati automaticamente all'inizio di ogni sessione, indicizzati in `MEMORY.md`. Percorso reale (Windows):

```
C:\Users\promb\.claude\projects\D--PROGETTI-KYKOS-KYKOS-WITH-CLAUDE\memory\
```

Ad ogni sessione, leggi in ordine:
1. `01-core-principles.md` — Le 3 regole non negoziabili (anonimato, enum tradotti, compatibilità all'indietro)
2. `04-anonymity.md` — Regole esatte sull'anonimato con esempi
3. `05-known-issues.md` — Bug/violazioni attuali da non perpetuare

Poi le memorie specialistiche elencate in `MEMORY.md` quando pertinenti al task in corso.

## Le Regole Non Negoziabili

### 1. ANONIMAT
**L'anonimato DONATORE ↔ RICEVENTE non è mai violato.**

- Il donatore non sa chi ha ricevuto il suo oggetto
- Il ricevente non sa chi ha donato
- Solo l'INTERMEDIARIO vede entrambi (gestisce fisicamente la logistica)
- Il PUBBLICO (non autenticato) **NON vede oggetti**

### 2. ENUMERATI TRADOTTI
**Gli enum NON devono mai essere mostrati così come sono.**

- `AVAILABLE` → "Disponibile"
- `PENDING` → "In attesa"
- `BRONZE` → "Bronzo"
- ecc.

Usa sempre le label da `src/types/index.ts`: `STATUS_LABELS`, `CATEGORY_LABELS`, `DONOR_LEVEL_LABELS`, ecc.

## Visibilità Base

| Ruolo | Può vedere oggetti? | Nome donatore? | Nome ricevente? |
|-------|---------------------|----------------|-----------------|
| PUBBLICO | **NO** (auth richiesta) | Mai | N/A |
| DONATORE | Sì (i propri) | N/A | **MAI** |
| RICEVENTE | Sì (browse) | **MAI** | N/A |
| INTERMEDIARIO | Sì (tutti) | SÌ | SÌ |
| ADMIN | Statistiche only | **MAI** | **MAI** |

## Quando Implementi

1. **Check anonimato**: Ogni route API che ritorna dati utente, verifica chi deve vedere cosa
2. **Select minimo**: Default = `id` e `donorProfile.level`. Aggiungi campi solo se richiesto dal business logic
3. **Quando in dubbio**: Controlla la cartella memorie (vedi sopra) prima di chiedere

## Stack Tecnologico

- Next.js 16 (App Router), Prisma 5, Supabase (PostgreSQL + Storage), Vercel
- Auth JWT via `src/lib/auth.ts`
- JWT cookies separati: `session` (utenti), `operator_session` (staff)

## Test Anonimato Veloce

Prima di committare, cerca:
- `donor.name` — deve apparire solo in route Intermediario
- `recipient.name` — deve apparire solo in route Intermediario
- `select: { name: true }` su relazioni User — verifica necessità
