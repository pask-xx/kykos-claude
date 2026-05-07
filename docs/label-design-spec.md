# Specifica Etichetta QR Code — KYKOS

## Panoramica

Stampare un'etichetta adesiva (50×30 mm) da applicare all'oggetto consegnato presso l'ente.
L'etichetta contiene un QR code che, in fase di ritiro, consente all'operatore di verificare l'identità dell'oggetto e visualizzare informazioni utili sulla transazione.

---

## Layout Etichetta

```
┌────────────────────────────────────────┐
│ ┌──────┐  ┌─────────────────────────┐ │
│ │      │  │ 🏔️ Albero   LogoKykos    │ │
│ │ QR   │  │─────────────────────────│ │
│ │ 23×23│  │ ID: #req-8f3a9          │ │
│ │ mm   │  │ Per: Mario Rossi        │ │
│ │      │  │ Contenuto: Scatola vestiti│ │
│ │      │  │ Ritiro: 2026-05-10       │ │
│ │      │  │ Stato: PRONTO            │ │
│ └──────┘  └─────────────────────────┘ │
└────────────────────────────────────────┘
  23mm                    27mm
  ← ← ← ← ← ← 50mm → → → → → →
           30mm
```

| Elemento | Dimensioni | Posizione |
|----------|------------|-----------|
| QR Code | 23×23 mm | Left, top-aligned (2mm margin) |
| Area destra (header) | 27 mm width | Right of QR, starts at top |
| Area destra (body) | 27 mm width | Below header, full remaining height |
| Margini stampa | 2 mm per lato | Safe zone interna |

---

## Contenuto QR Code

**Stringa da codificare** (esistente):
```
kykos:object:pickup:{requestId}:{recipientId}
```

Questo formato è già supportato dal sistema — il QR pickup contiene requestId e userId, e in fase di scansione il sistema determina automaticamente se è un'operazione di consegna (deliver) o ritiro (pickup).

---

## Contenuto Testo Etichetta

### Header (max 10mm height)
- Icona albero SVG (8×8 mm)
- Nome "Kykos" accanto al logo

### Body — Dati Transazione

| Campo | Fonte | Formato |
|-------|-------|---------|
| ID Richiesta | `requestId` | `#req-xxxx` (primi 8 chars) |
| Destinatario | `recipient.name` | Nome completo |
| Contenuto | `object.title` / `goodsRequest.title` | Troncato a 20 chars |
| Data Ritiro | `depositDate` o `createdAt + 7gg` | `YYYY-MM-DD` |

---

## Integrazione UI

### Momento di Stampa
Step opzionale dopo il salvataggio della posizione di deposito.

**Flusso attuale:**
```
Scansione QR → Registro Posizione → Salvataggio → (redirect a scan-qr)
```

**Flusso modificato:**
```
Scansione QR → Registro Posizione → Salvataggio → [Step opzionale stampa etichetta] → (redirect a scan-qr)
```

### Pagine da modificare

1. **`/operator/deposit/[requestId]/page.tsx`** (oggetti) ✅
   - Flusso: Scan QR consegna → Registra posizione → Stampa etichetta (opzionale) → scan-qr

2. **`/operator/goods-deposit/[requestId]/page.tsx`** (beni) ✅
   - Flusso: Scan QR consegna beni → Registra posizione → Stampa etichetta (opzionale) → scan-qr

3. **`/operator/pickup/[requestId]/page.tsx`** (ritiro oggetti)
   - Flusso: Scan QR ritiro → Leggi posizione oggetto → Verifica con scan QR oggetto → Conferma ritiro
   - Non prevede stampa etichetta

4. **`/operator/goods-pickup/[requestId]/page.tsx`** (ritiro beni)
   - Flusso: Scan QR ritiro → Leggi posizione bene → Conferma ritiro
   - Non prevede stampa etichetta

### Comportamento Dialog Stampa

```
┌──────────────────────────────────────────┐
│        🖨️ Stampa Etichetta               │
├──────────────────────────────────────────┤
│                                          │
│  [Anteprima etichetta 50×30mm]           │
│                                          │
│  □ Stampa automaticamente                │
│                                          │
├──────────────────────────────────────────┤
│  [Stampa]              [Salta >>]       │
└──────────────────────────────────────────┘
```

- **Stampa**: apre finestra dialog stampante
- **Salta**: ignora e continua al redirect

---

## Specifiche Tecniche

### Generazione QR

Usare la funzione esistente `generateQrCodeDataUrl` o crearne una versione per label con:
- QR size: 150px (per qualità di stampa 203dpi)
- Colore: `#059669` (verde KYKOS)
- Background: bianco

### Composizione Etichetta

L'etichetta viene composta lato client usando:
- Canvas HTML per assemblare QR + testi
- `window.print()` con CSS `@media print` per stampare solo l'area del label

### Dati Necessari dall'API

L'endpoint di deposit deve restituire anche:
```typescript
{
  success: true,
  labelData: {
    requestId: string,
    recipientName: string,
    itemDescription: string,
    depositDate: string,
    status: string,
    qrData: string  // la stringa encoded per il QR
  }
}
```

---

## API Changes

### `POST /api/operator/scan-qr/[requestId]/deposit` ✅

Restituisce `labelData` nella response.

### `POST /api/operator/scan-qr-goods` ✅

Restituisce `labelData` nella response.

---

## Priorità Implementazione

1. **Fase 1**: Modificare deposit page per mostrare dialog stampa (core feature)
2. **Fase 2**: Stessa integrazione in goods-deposit
3. **Fase 3**: Integrazione nella pagina ritiro per verifica oggetto

---

## Note

- L'etichetta è **opzionale** — l'operatore può saltare la stampa
- Il QR code esistente per pickup funziona già come verifica — questa etichetta aggiunge solo supporto cartaceo per oggetti senza display
- Il logo `LogoKykosTesto.svg` è già disponibile in `/public/`