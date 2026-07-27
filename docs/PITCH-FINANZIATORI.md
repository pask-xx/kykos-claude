# KYKOS — Presentazione per finanziatori

> Documento di pitch. Taglio: fondazione / filantropico.
> Versione: giugno 2026.

---

## 1. Una sintesi in trenta secondi

**KYKOS** è una piattaforma digitale che permette a chi ha un oggetto in buone condizioni di donarlo a una persona in difficoltà economica, **senza che nessuno dei due conosca l'identità dell'altro**. A fare da ponte ci sono enti del terzo settore già radicati sul territorio (parrocchie, Caritas diocesane, associazioni), che verificano i riceventi, ritirano gli oggetti e li consegnano fisicamente.

KYKOS non è "un altro portale di donazioni". La sua ragione d'essere è una scelta etica precisa:

> *La donazione è un gesto gratuito. Perché sia dignitoso per chi dona e per chi riceve, deve restare anonima.*

---

## 2. I principi fondanti

### 2.1 Anonimato bilaterale non negoziabile

| Ruolo | Vede chi ha donato? | Vede chi ha ricevuto? | Vede l'oggetto? |
|---|---|---|---|
| Pubblico (non autenticato) | Mai | Mai | **No** — autenticazione richiesta |
| Donatore | — | **Mai** | Sì (i propri) |
| Ricevente | **Mai** | — | Sì (catalogo) |
| Ente intermediario | Sì | Sì | Sì (tutti) |
| Amministratore di sistema | Mai (mai PII) | Mai (mai PII) | Solo statistiche |

L'anonimato non è una "modalità opzionale". È **codificato** nei contratti delle API, nei permessi Prisma, nei test di regressione, nei componenti UI. Ogni rotta `/api/donor/*` ha un controllo `session.role === 'DONOR'` e ritorna solo l'identificativo tecnico del ricevente, mai il nome. Lo stesso vale in direzione opposta.

**Perché questa scelta**
- **Dignità di chi riceve**: chi è in difficoltà economica non viene esposto, non diventa "un caso".
- **Libertà di chi dona**: chi dona lo fa per principio, non per essere riconosciuto.
- **Sostenibilità del gesto**: senza dinamiche di riconoscimento, il sistema non degenera in competizione di status o in logiche clientelari.

### 2.2 Gratuito per chi riceve, simbolico per chi dona

L'oggetto è gratuito. KYKOS chiede — solo al donatore, solo al momento del passaggio di consegna — un contributo simbolico dell'ordine di 1-2 €, che va **integralmente all'ente intermediario** per coprire i suoi costi operativi (spazi, trasporti, materiali, telefono).

Questa scelta ha tre effetti positivi:
1. **Sostentamento dell'ente**: chi fa il lavoro fisico non lo fa gratis, e non dipende da bandi.
2. **Filtro etico del donatore**: una donazione non è "click e dimentico", ma un gesto con un minimo di consapevolezza economica.
3. **Nessuna mercificazione del ricevente**: nessun pagamento esce dalla sua parte, in nessuna fase.

### 2.3 L'ente intermediario come garante

KYKOS non bypassa il terzo settore: lo rafforza. L'ente:
- verifica l'effettiva condizione di bisogno del ricevente (in modo continuativo, non spot);
- gestisce fisicamente il deposito, il ritiro, la consegna, le etichette;
- è l'unico soggetto che vede entrambe le parti — quindi l'unico che può gestire il "margine umano" (misure diverse, urgenze, eccezioni).

### 2.4 Tecnologia a servizio, non protagonista

KYKOS usa uno stack gratuito o quasi (Next.js, Supabase free tier, Vercel free tier). I costi di infrastruttura per migliaia di utenti attivi restano prossimi allo zero. Questo significa che **la maggior parte di ogni euro raccolto va al programma**, non all'infrastruttura.

---

## 3. Gli attori in gioco

KYKOS coinvolge **cinque ruoli distinti**, ognuno con una dashboard, un set di permessi e un'esperienza dedicata.

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│    DONATORE      │        │   RICEVENTE      │        │      ENTE        │
│                  │        │                  │        │  INTERMEDIARIO   │
│ - Pubblica       │  ◀───  │ - Sfoglia        │  ───▶  │                  │
│   oggetti        │  (anon)│ - Richiede       │  (anon)│ - Verifica       │
│ - Vede richieste │        │ - Riceve         │        │ - Ritira/consegn │
│   anonimizzate   │        │                  │        │ - Gestisce staff │
└──────────────────┘        └──────────────────┘        └────────┬─────────┘
                                                                 │
                                                    ┌────────────┴───────────┐
                                                    ▼                        ▼
                                          ┌──────────────────┐    ┌──────────────────┐
                                          │    OPERATORI     │    │  AMMINISTRATORE  │
                                          │   DELL'ENTE      │    │  DI PIATTAFORMA  │
                                          │                  │    │                  │
                                          │ - 4 sotto-ruoli  │    │ - Gestione enti  │
                                          │ - Anche "street" │    │ - Legal docs     │
                                          └──────────────────┘    └──────────────────┘
```

### Perché cinque e non tre

Il **donatore** e il **ricevente** sono i due estremi della relazione. L'**ente intermediario** è il soggetto giuridico (associazione, parrocchia) che risponde della propria operatività. Ma l'ente non opera da solo: ha **operatori**, ciascuno con compiti precisi (gestire le richieste, gestire gli oggetti, gestire i volontari, gestire i beneficiari "di strada") e con permessi granulari attivabili indipendentemente. L'**amministratore di piattaforma** è un soggetto separato, senza accesso ai dati personali delle persone: governa solo gli enti e la conformità legale.

---

## 4. Funzionalità per attore

### 4.1 Donatore

Il donatore è una persona fisica con oggetti ancora utilizzabili. Pubblica, segue le richieste che arrivano, porta l'oggetto all'ente.

**Cosa fa concretamente**

- **Pubblica un oggetto**: titolo, descrizione, categoria (arredamento, elettronica, abbigliamento, libri, cucina, sport, giocattoli, altro), condizione (nuovo, come nuovo, buono, discreto, da sistemare), fino a più foto.
- **Riceve richieste in forma anonima**: quando un ricevente chiede quell'oggetto, il donatore vede solo "qualcuno interessato" — nessun nome, nessun recapito, nessuna storia personale. Può accettare, attendere, o segnalare un problema.
- **Conferma la consegna fisica**: porta l'oggetto all'ente, l'operatore dell'ente registra il passaggio. Da quel momento l'oggetto è ufficialmente "depositato" presso l'ente.
- **Traccia lo stato**: l'oggetto passa per stati chiari — *Disponibile → Prenotato → Depositato → Donato*. A ogni transizione il donatore riceve una notifica.
- **Gestisce il proprio profilo**: dati anagrafici opzionali, diocesi di riferimento, foto profilo. Soft-delete con disattivazione: lo storico resta ma l'account diventa inerte, e gli oggetti già depositati proseguono il loro percorso normalmente.

**Cosa non vede (di proposito)**
- mai il nome del ricevente finale;
- mai lo stato personale o il reddito di chi ha richiesto;
- mai la corrispondenza "chi ha preso cosa" — sa solo che il suo oggetto è stato consegnato.

**Incentivo morale: il "livello donatore"**
Ogni donatore accumula un *livello* — Bronzo, Argento, Oro, Platino, Diamante — calcolato automaticamente sulle donazioni completate. Non dà vantaggi economici. Dà solo un segno di percorso, paragonabile a una "medaglia" simbolica. È un riconoscimento etico, non un sistema di gamification commerciale.

---

### 4.2 Ricevente

Il ricevente è una persona in condizione di difficoltà economica, già conosciuta e accompagnata da un ente (il suo *ente di riferimento*). Può sfogliare gli oggetti disponibili nella propria area geografica e richiederli.

**Cosa fa concretamente**

- **Si registra** presso un ente di riferimento: l'ente verifica la condizione di bisogno (in modo continuativo), e solo allora abilita l'utente a richiedere oggetti.
- **Sfoglia il catalogo**: oggetti filtrati per categoria, condizione, diocesi, distanza geografica. Vede *cosa c'è*, non *chi lo dona*.
- **Richiede un oggetto**: la richiesta è anonima verso il donatore. Il ricevente può allegare un messaggio (opzionale) che l'ente legge ma il donatore no — utile per segnalare, ad esempio, "mi serve per mio figlio di 6 anni".
- **Riceve conferma**: quando la richiesta è approvata, riceve un QR code e le istruzioni per il ritiro fisico presso l'ente. La consegna è fisica, in un luogo neutro (la sede dell'ente).
- **Richiede beni non ancora disponibili**: se il bene desiderato non è in catalogo, può pubblicare una **richiesta di bene** — altri utenti (donatori o anche altri riceventi in possesso dell'oggetto) possono "offrirsi" di procurarlo.
- **Richiede un servizio**: idem, per servizi (piccole riparazioni, lezioni, accompagnamenti) — sempre in forma anonima, sempre validata dall'ente.

**Cosa non vede (di proposito)**
- mai il nome del donatore;
- mai l'indirizzo del donatore;
- mai un canale diretto di contatto con il donatore.

**Strumenti di tutela**
- Un **punteggio di bisogno** (0-100), basato su ISEE e affinabile dall'ente, influenza l'ordine in cui le richieste vengono valutate — utile in contesti di scarsità.
- Gli oggetti molto richiesti possono essere pubblicati come **disponibilità multipla** (es. "30 cappotti invernali"): l'ente assegna le unità in modo trasparente e tracciabile, evitando corse al click.
- Un **pulsante "fammi sapere"**: se un oggetto non è disponibile, il ricevente può chiedere di essere avvisato quando lo diventa, senza dover controllare ogni giorno.

---

### 4.3 Ente intermediario

L'ente intermediario (parrocchia, Caritas diocesana, associazione) è il soggetto che dà a KYKOS la propria legittimazione e radicamento territoriale. Ha una dashboard dedicata, profilo pubblico verificabile, e gestione operativa completa.

**Cosa fa concretamente**

- **Pubblica il proprio profilo**: nome, tipologia (Caritas / parrocchia / associazione), sede, orari, contatti, diocesi di appartenenza. L'ente è verificato dall'amministratore di piattaforma prima di andare online.
- **Gestisce gli operatori**: aggiunge, modifica, disattiva i propri operatori. Ogni operatore ha un sotto-ruolo (amministratore dell'ente, gestore richieste, gestore oggetti, gestore volontari, operatore semplice) e permessi granulari.
- **Autorizza i riceventi**: è l'ente che decide chi è in condizione di bisogno nel proprio territorio. Può modificare il punteggio di bisogno, sospendere, riabilitare.
- **Riceve fisicamente gli oggetti**: l'operatore dell'ente registra l'arrivo, indica lo scaffale / la postazione di deposito, stampa un'etichetta standard (dimensione configurabile per ente) per identificare l'oggetto.
- **Consegna fisicamente gli oggetti**: scansione del QR code del ricevente, consegna, registrazione. Tutto tracciato.
- **Gestisce richieste e segnalazioni**: vede le richieste in arrivo (con il messaggio del ricevente, anonimizzato verso il donatore), approva o rifiuta, risponde alle segnalazioni di problemi.
- **Crea campagne mirate** (*cause*): raccolte specifiche con obiettivo, scadenza, immagine. Esempio: "20 coperte entro Natale".
- **Gestisce disponibilità multiple**: pubblica lotti di oggetti omogenei (es. 50 pacchi di pasta) e assegna le unità con logica trasparente.

**Cosa vede (e perché è giusto che le veda)**
L'ente vede **entrambi i lati** — nome del donatore, nome del ricevente — perché è il soggetto che gestisce fisicamente la transazione. Senza questa visibilità non potrebbe fare il suo lavoro. Questa eccezione è **l'unica** nel sistema ed è esplicitamente documentata.

---

### 4.4 Operatore dell'ente

L'operatore è la persona fisica che lavora nell'ente. Può essere un volontario, un dipendente, una figura mista. Ha un suo account, una sua dashboard, e un ruolo specifico.

**I sotto-ruoli**

- **Amministratore ente**: gestisce operatori, configurazione dell'ente, integrazioni.
- **Gestore richieste**: vede e processa le richieste in arrivo.
- **Gestore oggetti**: gestisce catalogo, deposito, etichette, consegne.
- **Gestore volontari**: amministra i volontari iscritti all'ente (candidature, sospensioni).
- **Operatore semplice**: combinazione di permessi granulari, configurata dall'amministratore dell'ente.

**Una variante importante: l'operatore "di strada"**
Quando un beneficiario non ha device, connessione, o competenze digitali, l'operatore di strada agisce *per conto suo*: prende le richieste a suo nome, gestisce la consegna fisica, e dialoga con l'ente. È un modello *fiduciario*, pensato per le situazioni di fragilità più marcata. In questo caso l'anonimato KYKOS (donatore ↔ ricevente) non si applica nella relazione operatore↔beneficiario: il beneficiario ha consapevolmente affidato i propri dati a una persona di cui si fida.

**Funzionalità concrete**
- Dashboard personalizzata per ruolo con sezioni su misura (es. il gestore oggetti vede "ritira", "deposita", "etichetta"; il gestore richieste vede "in attesa", "approva", "rifiuta").
- Notifiche in tempo reale su nuove richieste, nuovi oggetti, scadenze.
- Strumenti di stampa etichette con codici identificativi per il deposito fisico.
- Scanner QR integrato (anche da mobile, via fotocamera).
- Cambio password con invalidazione immediata della sessione.

---

### 4.5 Amministratore di piattaforma

L'amministratore di KYKOS è una figura tecnica, non operativa: garantisce che il sistema funzioni e sia conforme alla legge. **Non vede mai dati personali di donatori e riceventi.**

**Cosa fa concretamente**

- **Verifica gli enti**: prima di andare online, ogni ente passa per un processo di verifica documentale. L'amministratore convalida o respinge.
- **Gestisce la documentazione legale**: pubblica le versioni correnti di Privacy Policy e Termini di Servizio, mantiene lo storico immutabile (utile in caso di audit Garante), tiene traccia di *chi ha accettato cosa e quando* con hash del PDF al momento dell'accettazione.
- **Vede statistiche aggregate**: numero di enti attivi, numero di oggetti transitati, andamento per diocesi. Mai dati personali.
- **Gestisce audit log**: chi ha fatto cosa e quando sulle risorse amministrative.

---

## 5. Caratteristiche trasversali

Alcune scelte di design sono coerenti su tutti gli attori, e raccontano la filosofia del progetto.

### 5.1 Mobile-first, ma non solo mobile

Tutte le dashboard sono ottimizzate per smartphone (perché la vita reale — l'oggetto da fotografare, la consegna all'ente — avviene spesso in mobilità). Ma l'interfaccia funziona altrettanto bene su desktop per gli operatori che lavorano in ufficio.

### 5.2 Accessibilità

KYKOS è progettato per essere usabile da chiunque:
- contrasti conformi WCAG su tutti i colori;
- ogni icona decorativa è marcata come tale per gli screen reader;
- ogni campo modulo ha un'etichetta semanticamente collegata;
- ogni bottone icon-only ha un'etichetta per gli screen reader;
- i toggle sono accessibili (ruolo + stato, non solo colore).

### 5.3 Privacy by design

- Minimizzazione: le route API ritornano solo i campi strettamente necessari (un donatore che chiede "vedi le mie richieste" riceve `id, status, createdAt`, non `recipient.name`).
- Soft-delete: nessun dato viene mai cancellato fisicamente in modo che possa causare perdita di storico. La disattivazione di un profilo è reversibile a fini di audit.
- Consensi legali versionati: ogni accettazione di Privacy o ToS è registrata con versione, hash del PDF, timestamp, IP, user-agent — pronto per un audit Garante.
- Validazione file con magic bytes: gli upload accettano solo i file dichiarati, controllati a livello di contenuto (non solo estensione).

### 5.4 Affidabilità tecnica

- Gestione di concorrenza: quando più riceventi richiedono lo stesso oggetto, il sistema garantisce che **uno solo** lo ottenga. La transazione è atomica a livello di database.
- Soft-delete + retry per operazioni esterne: quando un'operazione coinvolge un servizio esterno (es. invio email, cancellazione Supabase Auth), è gestita con retry e backoff, e l'errore non lascia mai il sistema in stato inconsistente.
- Audit log di tutte le azioni amministrative.

### 5.5 Costi operativi bassi per design

Lo stack tecnologico è scelto per minimizzare i costi fissi:
- hosting serverless (Vercel) con free tier abbondante;
- database PostgreSQL gestito (Supabase) free tier fino a 500 MB;
- storage foto (Supabase Storage) free fino a 1 GB;
- autenticazione gestita (Supabase Auth) senza costi ricorrenti.

Ad oggi, con diverse migliaia di utenti attivi, **i costi di infrastruttura sono prossimi allo zero**. Il dettaglio numerico è riservato a interlocutori in fase di due diligence, ma rientra abbondantemente nei margini di una piccola associazione.

---

## 6. Lo stato del progetto

A giugno 2026 KYKOS è in fase di pre-pilota operativo. Lo stack produttivo è completo e verificato:
- schema dati esteso (donatori, riceventi, enti, operatori, richieste, donazioni, pagamenti simbolici, segnalazioni, volontari, campagne, disponibilità multiple, consensi legali);
- cinque dashboard complete, ognuna con decine di viste;
- centotrenta rotte API, di cui molte testate con test di regressione;
- GDPR-compliant con versioning dei consensi;
- pubblicabile e pronto per il primo pilota diocesano.

Il passaggio immediatamente successivo è l'apertura controllata a una o due diocesi pilota, con un protocollo di osservazione definito (vedi `docs/PILOT-RUNBOOK.md`).

---

## 7. Perché KYKOS è un buon investimento per una fondazione

Per una fondazione che valuta un progetto, KYKOS offre quattro caratteristiche che raramente coesistono:

1. **Chiarezza di mission**: anonimato, dignità, gratuità, ruolo del terzo settore. Non c'è ambiguità sul cosa si sta finanziando.
2. **Scalabilità reale**: la piattaforma può crescere territorialmente (una diocesi alla volta) senza richiedere proporzionalmente più personale tecnico. Il moltiplicatore è l'ente locale, che già esiste.
3. **Sostenibilità economica autonoma**: il contributo simbolico sull'oggetto donato copre i costi operativi correnti degli enti. La fondazione può finanziare lo sviluppo iniziale e l'avvio del pilota senza creare dipendenza a lungo termine.
4. **Misurabilità dell'impatto**: ogni donazione è tracciata, ogni consegna è tracciata, ogni stato è tracciato. I KPI sono estraibili in modo pulito senza ledere la privacy delle persone.

---

## 8. Come procedere

Una donazione o un grant a KYKOS in questa fase può essere destinata a:

- **Avvio del primo pilota diocesano** (1 diocesi, 1-3 enti, 3-6 mesi, budget operativo definito).
- **Consolidamento tecnico** (audit di sicurezza, penetration test, hardening pre-scale-up).
- **Sviluppo di moduli aggiuntivi** (es. integrazione con servizi sociali del territorio, dashboard per diocesi, moduli di reportistica per enti).
- **Formazione degli enti pilota** (onboarding operatori, materiali di accompagnamento).

Siamo disponibili a un incontro di approfondimento, a una demo operativa, o a una sessione tecnica con il vostro team di valutazione.

**Contatto**: [inserire recapiti del referente KYKOS]

---

*Documento redatto a giugno 2026. Il dettaglio tecnico è mantenuto accurato al momento della stesura; per dati quantitativi aggiornati, chiedere in fase di due diligence.*