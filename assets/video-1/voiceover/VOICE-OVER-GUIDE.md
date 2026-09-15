# Voice-Over — Guida Operativa Step-by-Step

> **Obiettivo**: generare 35 clip MP3 di voice-over italiano (~94s totali) per KYKOS Video 1.
> **Stima costo**: **GRATUITO** con free tier (lo script è ~1700 caratteri parlati, sotto i 10k del free tier).
> **Tempo**: ~30-45 minuti per generare tutte le clip + salvarle con il naming corretto.

---

## 🎯 Percorso A — ElevenLabs (consigliato)

### Step 1 — Crea account
1. Vai su [https://elevenlabs.io](https://elevenlabs.io)
2. Clicca **"Sign Up"** in alto a destra
3. Registrati con Google (più veloce) o email
4. Scegli il **Free tier** ($0/mese, 10.000 caratteri/mese) — basta e avanza per KYKOS
5. Niente carta di credito richiesta

> 💡 **Perché Free tier basta**: il nostro script è ~1700 caratteri parlati. Hai 10.000 caratteri/mese. Avanzano ~8.300 per altri progetti.

### Step 2 — Trova la voce italiana maschile
1. Dopo il login, vai su **"Voices"** → **"Voice Library"** (icona libreria in alto)
2. Filtri in alto:
   - **Language**: `Italian`
   - **Gender**: `Male`
   - **Use case**: `Narration` (deseleziona gli altri)
3. Voci italiane maschili predefinite più adatte a KYKOS:
   - **Giuseppe** — voce matura, calda, "nonno saggio" → ⭐ consigliata per tono istituzionale KYKOS
   - **Lorenzo** — giovane, avvolgente, più "social" → alternativa per tono più leggero
   - **Adriano** — profonda, narrativa, perfetta per storytelling → alternativa premium
4. Clicca sulla voce → **"Play"** per ascoltare un sample di 5-10 secondi
5. Quando trovi quella giusta, clicca **"Add to My Voices"** (aggiungila alle tue)

### Step 3 — Configura la generazione
1. Vai su **"Text to Speech"** (icona testo a sinistra)
2. In alto a destra, seleziona:
   - **Model**: `Eleven Multilingual v2` (migliore per italiano, NON v1)
   - **Voice**: la voce italiana che hai aggiunto (es. "Giuseppe")
3. Impostazioni (slider in basso):
   - **Stability**: `65%` (non troppo rigido, lascia micro-variazioni)
   - **Clarity + Similarity**: `80%`
   - **Style Exaggeration**: `25%` (tono caldo ma non teatrale)
   - **Speaker Boost**: `ON` (migliora la chiarezza)

### Step 4 — Genera le 35 clip

Per ogni riga del file `SCRIPT.md`, copia SOLO il testo dentro le virgolette `**"..."**` (senza il `>` iniziale, senza i `**`).

**Procedura per ogni clip**:
1. Apri `assets/video-1/voiceover/SCRIPT.md` nel tuo editor
2. Trova la riga del dialogo (es. `> **"Io sono il Donatore."**`)
3. Copia SOLO il testo: `Io sono il Donatore.`
4. Incolla nel campo di testo di ElevenLabs
5. Clicca **"Generate"**
6. Ascolta il risultato → se OK, clicca l'icona **download** (freccia giù) per scaricare MP3
7. Rinomina il file secondo la convenzione indicata nello script:
   - Voce narrante in `SCRIPT.md`: `vo-00-intro-D.mp3` → il file scaricato diventa quel nome
8. Salvalo in `D:\PROGETTI\KYKOS\KYKOS-WITH-CLAUDE\assets\video-1\voiceover\`

**Esempio completo per la prima clip**:

In SCRIPT.md trovi:
```
### vo-00-intro-D.mp3 (0.0–1.3s)
> **"Io sono il Donatore."**
```

→ Copi `Io sono il Donatore.` → Incolli in ElevenLabs → Generi → Scarichi → Rinomini in `vo-00-intro-D.mp3` → Salvi in `assets/video-1/voiceover/`.

### Step 5 — Lista di tutte le 35 clip da generare

**Scena 0 (7 clip)**:
- `vo-00-intro-D.mp3` → "Io sono il Donatore."
- `vo-00-intro-B.mp3` → "Io sono il Beneficiario."
- `vo-00-intro-O.mp3` → "Io sono l'Operatore dell'ente."
- `vo-00-intro-S.mp3` → "Io sono l'Operatore di strada."
- `vo-00-intro-V.mp3` → "Io sono il Volontario."
- `vo-00-intro-E.mp3` → "L'ente che ciunisce."
- `vo-00-claim.mp3` → "Donare è semplice. È anonimo."

**Episodio 1 (9 clip)**:
- `vo-01-ep1-casa-D.mp3` → "A volte abbiamo cose che non usiamo più..."
- `vo-01-ep1-foto.mp3` → "...e basta un gesto per condividerle."
- `vo-01-ep1-casa-B.mp3` → "Da qualche parte, qualcuno sta cercando proprio quella cosa."
- `vo-01-ep1-abbinamento.mp3` → "KYKOS abbina automaticamente chi dona a chi riceve, in totale anonimato."
- `vo-01-ep1-qr-D.mp3` → "Il donatore riceve il QR per consegnare."
- `vo-01-ep1-ente.mp3` → "L'oggetto arriva all'ente, in modo sicuro e tracciato."
- `vo-01-ep1-qr-B.mp3` → "Il beneficiario riceve il QR per ritirare."
- `vo-01-ep1-ritiro.mp3` → "E il cerchio si chiude, con un sorriso."
- `vo-01-ep1-finale.mp3` → "Donare è semplice. È anonimo. È KYKOS."

**Episodio 2 (9 clip)**:
- `vo-02-ep2-ricerca-B.mp3` → "A volte serve qualcosa che non c'è ancora."
- `vo-02-ep2-ente-verifica.mp3` → "L'ente verifica l'esigenza e la rende visibile."
- `vo-02-ep2-doppia-offerta.mp3` → "Chi ha qualcosa da offrire può proporre. Nessuno sa chi è chi."
- `vo-02-ep2-altre-proposte.mp3` → "Più proposte possono arrivare, anche da altri donatori."
- `vo-02-ep2-scelta.mp3` → "Il beneficiario sceglie liberamente."
- `vo-02-ep2-qr-D.mp3` → "Il donatore riceve il QR per consegnare."
- `vo-02-ep2-consegna.mp3` → "Consegna sicura all'ente."
- `vo-02-ep2-ritiro.mp3` → "Il beneficiario ritira, in anonimato."
- `vo-02-ep2-finale.mp3` → "Un dono che cambia una giornata. KYKOS."

**Episodio 3 (9 clip)**:
- `vo-03-ep3-casa-B.mp3` → "Chi ha bisogno non sempre ha uno smartphone o sa usare un'app."
- `vo-03-ep3-incontro-S.mp3` → "L'operatore di strada è il ponte tra chi ha bisogno e KYKOS."
- `vo-03-ep3-S-pubblica.mp3` → "Con il suo consenso, l'operatore pubblica la richiesta per lui."
- `vo-03-ep3-pubblicata.mp3` → "La richiesta dell'operatore di strada è già accreditata e subito visibile ai donatori."
- `vo-03-ep3-D-propongo.mp3` → "Chi ha qualcosa da offrire può rispondere, sempre in anonimato."
- `vo-03-ep3-S-accetta.mp3` → "Il beneficiario sceglie, con l'aiuto dell'operatore di strada."
- `vo-03-ep3-ente-sicuro.mp3` → "Tutto avviene con la stessa sicurezza di sempre."
- `vo-03-ep3-S-porta-casa.mp3` → "Per chi ha difficoltà a muoversi, l'operatore di strada porta il dono a casa."
- `vo-03-ep3-finale.mp3` → "Anche chi non ha un device può donare e ricevere amore. KYKOS."

**Card finale (1 clip)**:
- `vo-finale-claim.mp3` → "Unisciti a KYKOS."

### Step 6 — ⚠️ Ricorda: le pause sono in montaggio
Le pause indicate in `SCRIPT.md` (es. `[pausa 0.3s]`) **NON vanno generate**. Genera SOLO la parola, poi in DaVinci Resolve aggiungerai le pause trascinando le clip nella timeline.

---

## 🆓 Percorso B — Azure TTS (gratuito senza limiti di brand)

Se ElevenLabs non ti convince o hai problemi di qualità italiano:

### Step 1 — Setup Azure
1. Vai su [https://azure.microsoft.com/it-it/products/cognitive-services/text-to-speech/](https://azure.microsoft.com/it-it/products/cognitive-services/text-to-speech/)
2. Clicca **"Prova gratuitamente"**
3. Crea account Microsoft (o usa quello esistente)
4. Attiva il servizio **"Speech"** (free tier = **500.000 caratteri/mese gratis** — più che sufficienti)
5. Vai su **Speech Studio** → **"Text-to-Audio"**

### Step 2 — Genera le clip
1. Incolla il testo di una singola riga (es. `Io sono il Donatore.`)
2. Scegli voce italiana: **`it-IT-DiegoNeural`** (maschile, calda) o **`it-IT-IsabellaNeural`** (femminile, più pubblicitaria)
3. SSML opzionale per pause (es. `<break time="300ms"/>`) — ma noi le mettiamo in post
4. Clicca **"Download"** → formato **WAV 16kHz mono**
5. Rinomina + salva come per ElevenLabs

> ⚠️ **Limite Azure**: la voce italiana è leggermente più "robotica" di ElevenLabs, ma per un primo draft è ottima. Se il risultato ti piace, tienila — risparmi $5/mese.

---

## 🎤 Percorso C — Registrazione tua (massimo controllo)

Se hai un microfono decente e una stanza silenziosa:

### Setup minimo
- **Microfono**: anche quello del laptop va bene per il primo draft (poi rivedi)
- **App**: **Audacity** (gratis) — registra, taglia, normalizza
- **Stanza**: chiudi finestre, spegni condizionatore/caloriferi, evita orari di punta

### Procedura
1. Apri `SCRIPT.md`, leggi una riga alla volta
2. In Audacity: registra → taglia silenzi → normalizza a -3dB
3. Esporta ogni clip come MP3 (qualità 192kbps mono)
4. Rinomina + salva in `assets/video-1/voiceover/`

> 💡 **Trucco**: se non hai tempo di registrare 35 clip, **registra solo le 9 frasi lunghe** (quelle emozionali, i claim finali degli episodi). Per le 26 brevi usa ElevenLabs free tier o Azure.

---

## 🔧 Troubleshooting

### La voce pronuncia male una parola italiana
- Aggiungi nel testo la **forma fonetica** tra parentesi prima della parola vera:
  - `KYKOS (chicos)` → l'AI leggerà "chicos" che suona simile a "KYKOS"
  - `QR (cu-erre)` → eviti la pronuncia automatica inglese
- Oppure usa **SSML** (solo ElevenLabs Pro e Azure) per forzare la pronuncia

### Il tono è troppo piatto o troppo drammatico
- Abbassa **Style Exaggeration** a `15-20%` (per tono istituzionale)
- Alzalo a `35-40%` (per tono più emozionale, storytelling)

### Le clip sono troppo veloci/lente
- In ElevenLabs non c'è uno slider di velocità diretto → usa **SSML** con `<prosody rate="0.9">` (più lento) o `rate="1.1"` (più veloce)
- In Audacity puoi rallentare/accelerare del 10% senza distorsione evidente

### Voglio una voce femminile
- ElevenLabs: **"Bianca"** o **"Sofia"** (italiane, naturali)
- Azure: **"it-IT-ElsaNeural"** o **"it-IT-IsabellaNeural"**

---

## ✅ Checklist finale

Dopo aver generato tutte le 35 clip:

- [ ] Tutte le 35 clip sono in `assets/video-1/voiceover/` con il nome esatto indicato in `SCRIPT.md`
- [ ] Hai ascoltato ogni clip e verificato che sia coerente di tono (no clip drammatica tra clip neutre)
- [ ] Hai eliminato le clip duplicate o con errori di pronuncia
- [ ] Hai un peso totale < 30 MB (ogni clip ~300-800 KB)
- [ ] (Opzionale) Hai copiato le clip in Google Drive / Dropbox come backup

**Se tutto ✅**: sei pronto per la Fase 5 (montaggio). Le pause tra le clip verranno inserite in DaVinci Resolve trascinando le clip nella timeline.

---

## 🎬 Prossima fase

Dopo aver completato la generazione voice-over, dimmelo e ti guido sulla **Fase 4 (musica sottofondo)** con raccomandazioni specifiche per il tono caldo-speranzoso del video KYKOS.

---

**Versione**: 1.0 — 15 settembre 2026
**Tempo stimato**: 30-45 minuti con free tier
**Costo stimato**: €0 (free tier basta)

### Fonti
- [ElevenLabs Pricing 2026](https://elevenlabs.io/pricing)
- [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
- [Microsoft Azure TTS](https://azure.microsoft.com/it-it/products/cognitive-services/text-to-speech/)
