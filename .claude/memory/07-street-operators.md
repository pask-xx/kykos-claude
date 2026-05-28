---
name: street-operators
description: Operatori di strada - anagrafiche slegate da account, visibilità diocesana, gestione beneficiari senza account
metadata:
  type: reference
---

# Operatori di Strada

## Concetto

Gli **operatori di strada** sono volontari/operai che afferiscono a un ente ma operano sul territorio. Operano per conto di persone (beneficiari) che non hanno (o usano raramente) strumenti digitali personali, quindi, sono gli operatori di strada che operano per loro, tramite il loro account KYKOS di operatori che lo usano come "strumento di lavoro".

La differenza fondamentale: **gestiscono beneficiari senza account** e hanno **visibilità diocesale**.

## Schema dati

### Flag Operators

```prisma
model Operator {
  // ... campi esistenti ...

  isOfficeOperator   Boolean @default(true)   // operatore d'ufficio (attuale comportamento)
  isStreetOperator   Boolean @default(false)  // operatore di strada

  // Un operatore può avere entrambi i flag:
  // - Solo isOfficeOperator=true → operatore d'ufficio (comportamento attuale)
  // - Solo isStreetOperator=true → solo street operator
  // - Entrambi true → può fare entrambe le attività

  @@map("operators")
}
```

### Beneficiario senza account (Street-Managed Recipient)

Usiamo `User` con ruolo `RECIPIENT` + flag `isStreetManaged` invece di tabella separata:

```prisma
model User {
  // ... campi esistenti ...

  isStreetManaged  Boolean @default(false)
  // true = non ha account proprio, gestito da street operators
  // false = account normale (comportamento attuale)

  // Relazione many-to-many con street operators che lo gestiscono
  managedBy       StreetOperatorBeneficiary[]

  @@map("users")
}

// Associa più street operators allo stesso beneficiario (turnazione/backup)
model StreetOperatorBeneficiary {
  id               String   @id @default(cuid())

  streetOperatorId String   // operatore di strada
  streetOperator   Operator @relation(...)

  beneficiaryId    String   // User (RECIPIENT) gestito
  beneficiary      User     @relation(...)

  assignedAt       DateTime @default(now())

  @@unique([streetOperatorId, beneficiaryId])
  @@index([streetOperatorId])
  @@index([beneficiaryId])
  @@map("street_operator_beneficiaries")
}
```

**Vantaggi:**
- Relazioni esistenti invariate (Request, Donation, etc. usano già `recipientId`)
- Conversione a account normale: basta impostare `isStreetManaged = false` + aggiungere credenziali
- Nessuna modifica alla logistica esistente
- **Più street operators possono gestire lo stesso beneficiario** (turnazione, backup) — tutti ricevono le notifiche

**Nota multi-operatore:**
- Un beneficiario `isStreetManaged` può essere assegnato a N street operators
- Tutti gli street operators associati ricevono notifiche per quel beneficiario
- Possono operare in modo intercambiabile sullo stesso beneficiario

## Visibilità

### Operatore di Strada vede:

| Risorsa | Visibilità |
|---------|------------|
| Oggetti disponibili | **Tutti gli enti della diocesi** |
| Richieste | Solo quellecreate per i suoi beneficiari |
| Beneficiari | Solo quelli a lui assegnati |
| Operatori ente | Solo il proprio ente |

### Operatore d'Ufficio vede:

| Risorsa | Visibilità |
|---------|------------|
| Oggetti disponibili | Solo il proprio ente |
| Richieste | Solo il proprio ente |
| Beneficiari anagrafiche | Solo il proprio ente |

## Flusso: Richiesta da beneficiario senza account

```
1. Street Operator crea Richiesta (per un User isStreetManaged)
   → Stato: APPROVED automaticamente (è delegato dell'ente)
   → Visibile a TUTTI i donatori della diocesi

2. Donatore vede la richiesta → fa Offerta

3. Street Operator riceve notifica offerta
   → Sceglie quale accettare

4. Se accettata:
   → Logistica: QR code genera ritiro
   → Riceve notifica himself
   → Ritira lui stesso Oporta QR al beneficiario

5. Consegna confermata via QR scan
```

## Flusso: Donatore offre disponibilità

```
1. Donatore pubblica disponibilità

2. Tutti gli Street Operators della diocesi vedono la disponibilità

3. Se uno Street Operator vuole assegnarla a un suo beneficiario:
   → Crea Richiesta per l'User isStreetManaged (già approvata)
   → Assegna la disponibilità alla richiesta

4. Notifica a chi l'ha presa in carico
```

## Notifiche

- **Solo in-app** (no email, no SMS)
- Tutti gli operatori usano la **stessa dashboard**, la visibilità è condizionata dai flag:
  - `isOfficeOperator=true` → vede contenuti da operatore d'ufficio
  - `isStreetOperator=true` → vede contenuti da street operator (beneficiari assegnati, richieste, offerte da valutare)
  - Entrambi true → vede tutto

## Permessi

```typescript
type OperatorCapabilities = {
  // Flag sui singoli operatori
  isOfficeOperator: boolean;   // può operare come operatore d'ufficio
  isStreetOperator: boolean;    // può operare come street operator

  // Operatore d'ufficio
  canManageOffice: boolean;    // gestisce oggetti, richieste del proprio ente
  canApproveRequests: boolean;

  // Operatore di strada
  canManageStreetBeneficiaries: boolean;  // crea/modifica anagrafiche senza account
  canCreateStreetRequests: boolean;      // crea richieste per beneficiari senza account
  canAssignToStreetBeneficiaries: boolean; // assegna disponibilità a beneficiari senza account
};
```

## Come implementare

1. **Migration**: aggiungere `isOfficeOperator Boolean @default(true)` e `isStreetOperator Boolean @default(false)` a `operators`
2. **User**: aggiungere `isStreetManaged Boolean @default(false)` ai RECIPIENT
3. **StreetOperatorBeneficiary**: tabella many-to-many tra Operator e User (per beneficiari street-managed)
4. **Nuove API**:
   - `POST /api/operator/street-beneficiaries` — crea beneficiario senza account
   - `GET /api/operator/street-beneficiaries` — lista beneficiari assegnati allo street operator
   - `POST /api/operator/street-beneficiaries/[id]/operators` — assegna altri street operators
   - `POST /api/operator/requests-street` — crea richiesta per beneficiario street-managed
5. **Visibilità diocesana**: filtrare query per `entity.dioceseId` per street operators
6. **Dashboard dedicata**: pagina `/operator/street` con focus su attività street
7. **Notifiche**: inviare a tutti gli street operators associati al beneficiario