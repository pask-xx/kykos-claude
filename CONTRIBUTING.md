# Contribuire a KYKOS

> Guida per nuovi contributor. Se stai lavorando con Claude Code, leggi anche [CLAUDE.md](./CLAUDE.md).

## Le 3 regole non negoziabili

Sono i principi fondanti del progetto. **NON derogare**, mai.

### 1. Anonimato DONATORE ↔ RICEVENTE

L'anonimato non è mai violato. Mai.

- Il donatore non sa chi ha ricevuto il suo oggetto
- Il ricevente non sa chi ha donato
- Solo l'INTERMEDIARIO vede entrambi (gestisce fisicamente la logistica)
- Il PUBBLICO (non autenticato) **NON vede oggetti**

**Prima di committare**, cerca `donor.name`, `recipient.name`, `select: { name: true }` su relazioni User. Devono apparire solo in route Intermediario. Vedi [memory/04-anonymity.md](./memory/04-anonymity.md) per i dettagli e gli esempi.

### 2. Enum tradotti

Gli enum NON devono mai essere mostrati così come sono in UI. Mai.

- `AVAILABLE` → "Disponibile"
- `PENDING` → "In attesa"
- `BRONZE` → "Bronzo"

Usa sempre le label da `src/types/index.ts`: `STATUS_LABELS`, `CATEGORY_LABELS`, `DONOR_LEVEL_LABELS`, ecc. Se serve una nuova label, aggiungila lì, non fare string magic inline.

### 3. Compatibilità all'indietro

Ogni intervento deve garantire:

- Nessuna alterazione di dati esistenti se non esplicitamente richiesto
- Nessuna rimozione di funzionalità consolidate
- Nessuna modifica del comportamento di funzioni esistenti se non oggetto dell'intervento

**Prima di ogni commit**: verificare che le funzionalità esistenti (score, badge, stati, API) siano ancora presenti e funzionanti. Lancia `npm run test:run`.

## Pattern architetturali introdotti dal refactor pre-pilota

Questi pattern sono il risultato del lavoro di cleanup (Fase 2, vedi [CHANGELOG.md](./CHANGELOG.md)). Usali e non duplicare.

### Helper centralizzati

- **`src/lib/operator-session.ts`** — `getOperatorSession()`, `requireOperatorSession()` per le route staff
- **`src/lib/role-routes.ts`** — mapping ruolo → path dashboard
- **`src/lib/api.ts`** — HOF `withErrorHandler` per route API con gestione errori consistente
- **`src/lib/layout-helper.ts`** — `requireUserSession(role)`, `KYKOS_VIEWPORT` per i 4 layout user
- **`src/lib/file-validation.ts`** — `validateFileMagicBytes()` per upload (vedi A7)

### Pattern race-safe (B1, B3)

Per operazioni "check-then-act" con rischio di race, usa sempre:

```ts
const result = await prisma.$transaction(async (tx) => {
  const reserved = await tx.object.updateMany({
    where: { id: objectId, status: 'AVAILABLE' },
    data: { status: 'RESERVED' },
  });
  if (reserved.count === 0) {
    throw new Error('RACE_LOST'); // -> 409 nel catch del route handler
  }
  return tx.request.create({ ... });
});
```

`updateMany` con WHERE condizionato è atomico. NON usare `findUnique` + check + `update` separati.

### Soft-delete (B2)

Per disattivare un utente, NON usare `user.delete`. Usa:

```ts
await prisma.user.update({
  where: { id },
  data: {
    deactivatedAt: new Date(),
    deactivatedActions: [...existing, 'oggetti cancellati', ...],
  },
});
```

Le operazioni esterne (Supabase `deleteUser`, email finali) vanno FUORI dalla transaction, con retry e best-effort. Non usare `try/catch` silente.

### Magic bytes validation (A7)

Per ogni route di upload, leggi il buffer e chiama `validateFileMagicBytes(buffer, ALLOWED_MIMES)` prima di chiamare Supabase. **MAI** fidarsi di `file.type` o `file.name`. Usa `validation.detectedMime` per il Content-Type e `validation.detectedExt` per l'estensione del path.

## Anti-pattern vietati

| Anti-pattern | Perché vietato | Alternativa |
|--------------|----------------|-------------|
| `as any` | Nasconde bug TypeScript | Narrowing esplicito o `as unknown as T` |
| Fallback `JWT_SECRET` | Permette deployment con secret debole | Assert esplicito (vedi A6) |
| `file.type` per validare upload | Bypassabile da client malevolo | `validateFileMagicBytes` (vedi A7) |
| `select: { name: true }` su User in route pubbliche | Viola anonimato | Solo in route Intermediario |
| `try/catch` silente su operazioni esterne | Nasconde fallimenti | Log + retry + best-effort documentato |
| `user.delete` per disattivazione | Perde storico | `user.update` con `deactivatedAt` (vedi B2) |
| `findUnique` + check + `update` per operazioni concorrenti | Race condition TOCTOU | `$transaction` + `updateMany` (vedi B1, B3) |
| Enum esposti grezzi in UI | Viola Regola #2 | `STATUS_LABELS[machineValue]` |

## Workflow di commit

1. **Un commit per intervento**. Messaggio che spiega il problema, non solo la soluzione.
2. **Test prima del commit**:
   ```bash
   npm run test:run   # 155 test devono passare
   npx tsc --noEmit   # 0 errori
   npm run lint       # 0 errori
   ```
3. **Formato messaggio**:
   ```
   <tipo>(<scope>): <ID-audit se applicabile> - descrizione breve
   
   Problema: <cosa era rotto>
   Fix: <cosa è cambiato>
   Test: <cosa è stato testato>
   ```
   Tipo: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`.
4. **Push su `staging`, non `main`**. Il deploy in produzione è manuale dopo approvazione.
5. **Verifica post-push**: controlla che la CI su Vercel preview sia verde.

## Visibilità per ruolo (per check anonimato)

| Ruolo | Vede oggetti? | Nome donatore? | Nome ricevente? |
|-------|---------------|----------------|-----------------|
| PUBBLICO | **NO** (auth richiesta) | Mai | N/A |
| DONATORE | Sì (i propri) | N/A | **MAI** |
| RICEVENTE | Sì (browse) | **MAI** | N/A |
| INTERMEDIARIO | Sì (tutti) | SÌ | SÌ |
| ADMIN | Statistiche only | **MAI** | **MAI** |
| STREET OPERATOR | Sì (per assistenza fisica) | Sì (per consegna) | Sì (suoi assistiti) |

## Risorse

- **[CLAUDE.md](./CLAUDE.md)** — Istruzioni operative per Claude Code
- **[REFACTOR-AUDIT.md](./REFACTOR-AUDIT.md)** — Audit pre-pilota con tutti i bug trovati
- **[CHANGELOG.md](./CHANGELOG.md)** — Storico modifiche
- **[memory/](./memory/)** — Memorie di sessione (caricate automaticamente da Claude Code)
- **[docs/](./docs/)** — Documentazione operativa (deploy, email, pilot runbook)

## Domande?

Apri una issue su GitHub. Per bug urgenti pre-pilota, contatta direttamente il maintainer.
