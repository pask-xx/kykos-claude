---
name: 03-domains
description: Permessi per ruolo, flussi utente, regole di dominio
metadata:
  type: reference
---

# Regole di Dominio KYKOS

## Flusso DONATORE
1. Registrazione → crea profilo → può aggiungere oggetti
2. Oggetto: DRAFT → AVAILABLE (dopo upload foto)
3. Ricevente richiede → Donatore vede richiesta (**SENZA nome ricevente**)
4. Donatore approva → consegna all'Intermediario → scan QR → Intermediario conferma
5. Donatore **MAI** scopre chi ha ricevuto

## Flusso RICEVENTE
1. Registrazione → invia ISEE → attende autorizzazione Intermediario
2. Naviga oggetti → vede solo `donorProfile.level` (**SENZA nome donatore**)
3. Richiede oggetto → attende approvazione Donatore
4. Intermediario notifica ritiro → Ricevente ritira → scan QR
5. Ricevente **MAI** scopre chi ha donato

## Flusso INTERMEDIARIO (Organizzazione)
1. Registra organizzazione → Admin verifica
2. Gestisce riceventi (autorizzazione)
3. Gestisce logistica: riceve da Donatore, consegna a Ricevente
4. **PUÒ vedere entrambi** i nomi (parte fidata)
5. Gestisce Operatori (staff)

## Flusso OPERATORE
- Staff dell'Intermediario
- JWT separato (`operator_session` cookie, non `session`)
- Scan QR per conferma pickup/consegna
- Gestisce richieste, riceventi, donatori per l'organizzazione

## Flusso ADMIN
- Gestisce organizzazioni intermediari (verifica, approva)
- Supervisione a livello piattaforma
- **NON DEVE mai esporre** nomi Donatore o Ricevente

## Regole Permessi Chiave

| Azione | Chi può fare |
|--------|-------------|
| Approva oggetto | Donatore (owner) |
| Approva richiesta | Donatore (owner oggetto) |
| Autorizza ricevente | Intermediario |
| Verifica intermediario | Admin |
| Scan QR (pickup) | Donatore → Intermediario |
| Scan QR (consegna) | Intermediario → Ricevente |
