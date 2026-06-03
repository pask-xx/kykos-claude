# Legal documents — fallback statici

Questi PDF sono **fallback statici** per i documenti legali, NON la source
of truth corrente.

## Source of truth

La versione corrente è gestita in `LegalDocumentVersion` (status='active') su
Supabase, letta da:
- `/api/legal/status` (privata, per utenti loggati)
- `/api/legal/check` (privata, solo bool)
- `/api/legal/current` (pubblica, no auth — usata da /auth/register)

I PDF "vivi" sono su Supabase Storage, bucket `legal-documents`, path
`documents/{type}/v{version}.pdf`.

## Perché esistono questi file in `public/`

Quando abbiamo introdotto la gestione dinamica dei documenti legali
(commit della Fase 3 / pianificazione admin-legal-versions), abbiamo
migrato tutti i call site da `/legal/privacy-v1.0.pdf` a
`/api/legal/current` (vedi `src/app/auth/register/page.tsx`).

Tuttavia **NON rimuoviamo** questi file:
- Alcuni link in email/newsletter già inviate potrebbero puntare qui
- Per audit Garante storico, avere il PDF "v1.0" come fallback verificabile
  in URL pubblica è utile in caso di dispute
- Rottura di un link pubblico è peggio che tenere un file vecchio

## Quando rimuoverli

Dopo 6+ mesi dal lancio pubblico (e dopo aver verificato che nessuna email
attiva punta a questi URL), cancellare:
- `public/legal/privacy-v1.0.pdf`
- `public/legal/terms-v1.0.pdf`
- L'intera cartella `public/legal/`
