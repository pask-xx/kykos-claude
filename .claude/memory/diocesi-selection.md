---
name: diocesi-selection
description: Selezione diocesi in registrazione e profilo con geolocalizzazione - tutti gli utenti devono selezionare la diocesi
metadata:
  type: reference
---

# Selezione Diocesi in Registrazione e Profilo

## Concetto

Tutti gli utenti (donatori, beneficiari, enti) devono selezionare la diocesi di appartenenza durante la registrazione. Questo permette ai donatori di vedere le richieste provenienti da tutti gli enti della diocesi, non solo dal proprio ente.

## Implementato (2026-05-29)

### Registrazione (`/auth/register`)

**Modifiche:**
- Aggiunto campo `dioceseId` (obbligatorio per tutti i ruoli)
- DioceseSelector appare dopo geolocalizzazione
- Mostra diocesi più vicine in base a lat/lng (max 50km di raggio)
- Per `RECIPIENT`: anche `referenceEntityId` obbligatorio (ente di riferimento)
- Per `INTERMEDIARY`: `dioceseId` già presente ma era facoltativo → ora obbligatorio

**Validazioni:**
- Tutti i ruoli DEVONO avere `dioceseId` valorizzato
- La geolocalizzazione è già obbligatoria per INTERMEDIARY e RECIPIENT
- Per DONOR: geolocalizzazione consigliata ma non obbligatoria

### API Registration (`/api/auth/register`)

Aggiunto campo `dioceseId` nel payload di registrazione.

### Profilo utente (`/auth/profile`)

TODO: Permettere modifica diocesi con filtri per distanza enti.

## Schema dati

La `dioceseId` viene salvata su:
- `User.dioceseId` per DONOR e RECIPIENT
- `Organization.dioceseId` per INTERMEDIARY

## Visibilità requests per donatori

Quando un donatore visualizza le richieste disponibili:
- Vede tutte le richieste della SUA diocesi (non solo del suo ente)
- L'ente mittente è comunque visibile (anonimato donatore ↔ ricevente preservato)

## Differenze per ruolo

| Ruolo | DioceseId | ReferenceEntityId | Geolocalizzazione |
|-------|-----------|-------------------|-------------------|
| DONOR | Obbligatoria | No | Consigliata |
| RECIPIENT | Obbligatoria | Obbligatoria | Obbligatoria |
| INTERMEDIARY | Obbligatoria | No | Obbligatoria |