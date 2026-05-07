# Specifica Etichetta QR Code — KYKOS

## Panoramica

Stampare un'etichetta adesiva (50×30 mm o 50×40 mm) da applicare all'oggetto consegnato presso l'ente.
L'etichetta contiene un QR code che, in fase di ritiro, consente all'operatore di verificare l'identità dell'oggetto.

---

## Configurazione

L'ente può configurare la stampa etichetta dalla pagina `/operator/organization`:

| Opzione | Descrizione |
|---------|-------------|
| **Stampa etichetta** | Flag yes/no per abilitare la stampa |
| **Formato** | `50x30` (standard) o `50x40` (grande) |

---

## Layout Etichetta

### Formato 50×30 mm

```
┌────────────────────────────────────────────────┐
│ ┌────────┐  ┌────────────────────────────────┐ │
│ │        │  │ 🏔️        LogoKykos             │ │
│ │   QR   │  │                                │ │
│ │ 23×23  │  │                                │ │
│ │  mm    │  │                                │ │
│ │        │  └────────────────────────────────┘ │
│ └────────┘  ┌────────────────────────────────┐ │
│             │ Mario Rossi                     │ │
│             │ Scatola vestiti                  │ │
│             │ Ritiro: 2026-05-10              │ │
└────────────────────────────────────────────────┘
```

### Formato 50×40 mm

```
┌────────────────────────────────────────────────┐
│ ┌────────┐  ┌────────────────────────────────┐ │
│ │        │  │ 🏔️        LogoKykos             │ │
│ │   QR   │  │                                │ │
│ │ 23×23  │  │                                │ │
│ │  mm    │  │                                │ │
│ │        │  │                                │ │
│ │        │  └────────────────────────────────┘ │
│ └────────┘  ┌────────────────────────────────┐ │
│             │ Mario Rossi                     │ │
│             │ Scatola vestiti                  │ │
│             │ Ritiro: 2026-05-10              │ │
└────────────────────────────────────────────────┘
```

### Elementi etichetta

| Elemento | Note |
|----------|------|
| QR Code | 23×23 mm, posizionato in alto a sinistra |
| Loghi | Albero SVG + LogoKykosTesto, ingranditi |
| Contenuto | Nome beneficiario, descrizione oggetto, data ritiro — full width sotto QR |

**Modifiche rispetto alla versione precedente:**
- Rimosso l'ID richiesta
- Loghi leggermente più grandi
- Contenuto testuale spostato in basso, sotto il QR, per tutta la larghezza

---

## Contenuto QR Code

**Stringa per QR di consegna (deliver):**
```
kykos:object:deliver:{requestId}:{donorId}
```

**Stringa per QR di ritiro (pickup):**
```
kykos:object:pickup:{requestId}:{recipientId}
```

---

## Flusso Operativo

### Flusso Consegna (Deposit)

```
1. Operatore scansiona QR oggetto → /operator/deposit/[requestId]
2. Operatore registra posizione deposito
3. Se printLabel = true:
   → Mostra dialog opzionale stampa etichetta
   → L'operatore può Stampa o Salta
4. Redirect a /operator/scan-qr?success=deposit
```

### Flusso Ritiro (Pickup)

```
1. Operatore scansiona QR ritiro → /operator/pickup/[requestId]
2. Sistema mostra info oggetto e posizione
3. Se printLabel = true:
   → Mostra sezione verifica QR (scansiona QR sull'etichetta)
   → L'operatore può scansionare o procedere senza verifica
4. Operatore conferma ritiro completato
5. Redirect a /operator/scan-qr?success=pickup
```

---

## Modifiche alle Pagine

### `/operator/organization/page.tsx` ✅
- Aggiunta sezione "Stampa etichetta" con toggle on/off
- Selezione formato: 50x30 o 50x40

### `/operator/deposit/[requestId]/page.tsx` ✅
- Se `showLabelDialog = true`: mostra dialog stampa etichetta
- Se `showLabelDialog = false`: redirect diretto a scan-qr

### `/operator/pickup/[requestId]/page.tsx` ✅
- Se `showVerifyPrompt = true`: mostra sezione verifica QR
- Se `showVerifyPrompt = false`: nasconde sezione verifica

---

## API Changes

### `PATCH /api/operator/organization` ✅
Accetta `printLabel: boolean` e `labelSize: string`

### `POST /api/operator/scan-qr/[requestId]/deposit` ✅
Restituisce `showLabelDialog: boolean` e `labelData: { labelSize: string, ... }`

### `GET /api/operator/requests/[requestId]/pickup` ✅
Restituisce `showVerifyPrompt: boolean` e `labelSize: string`

---

## Note

- L'etichetta è **opzionale** — l'operatore può saltare la stampa o procedere senza verifica
- Il QR code di verifica serve per confermare che l'etichetta applicata corrisponde all'oggetto corretto
- Il logo `LogoKykosTesto.svg` è già disponibile in `/public/`