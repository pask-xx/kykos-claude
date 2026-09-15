# Scene Video — Guida Operativa Pika Labs 2.0

> **Obiettivo**: generare 30+ clip video MP4 per KYKOS Video 1 (2:30) usando **Pika Labs 2.0** image-to-video.
> **Input**: 15 reference JPG in `assets/video-1/references/` (già pronte, stile Pixar/Ghibli).
> **Output atteso**: 30-35 clip video sincronizzate con le 35 clip voice-over.
> **Stile**: movimenti semplici (espressioni, gesti lenti, pan camera leggeri). NO azione dinamica.

---

## 🎯 Specifiche tecniche per Pika Labs 2.0

| Parametro | Valore | Note |
|---|---|---|
| **Modalità** | **Image-to-Video** | Ogni clip parte da una reference JPG |
| **Durata clip** | **4-5 secondi** (Pika supporta fino a 10s, ma meglio spezzare in clip corte sincronizzate con audio) |
| **Risoluzione** | **1920×1080** (orizzontale 16:9) | Compatibile con YouTube/sito |
| **Aspect ratio** | **16:9** widescreen | Stessa reference ratio |
| **FPS** | 24 fps | Coerente con stile animazione |
| **Motion Strength** | **2-3** (su scala 1-5 Pika) | Movimenti lenti, NO zoom aggressivo |
| **Camera Motion** | "subtle pan" o "static" | NO zoom veloce, NO dolly |
| **Seed** | Fisso per personaggio (es. seed 100 per D, 200 per B) | Coerenza tra scene dello stesso personaggio |
| **Output format** | MP4 H.264 | Standard editing |

### Parametri Pika Labs specifici

- **Prompt motion**: max 200 caratteri, descrivi SOLO il movimento (non la scena statica)
- **Negative prompt** (se disponibile in Pika): `realistic, photorealistic, photographic, live action, 3d render, cgi, fast motion, zoom in, zoom out, shaky camera`
- **Stylize**: 100-200 (per mantenere stile cartoon)
- **Frames per second**: 24

---

## 🎨 Stile prefix (da anteporre a TUTTI i motion prompt)

```
PIXAR-STYLE 2D CARTOON ANIMATION, soft pastel palette, warm golden lighting, smooth 24fps motion, simplified shapes, hand-drawn feel, NOT realistic, NOT photographic. Slight breathing motion and gentle expression changes only.
```

---

## 🖼️ Mapping Reference → Scene

Prima di scrivere i prompt, identifica quale reference usare per ogni scena:

| Scena | Personaggio | Reference da usare |
|---|---|---|
| 0.1 (D intro) | D base | `ref-D-base.jpg` |
| 0.2 (B intro) | B base | `ref-B-base.jpg` |
| 0.3 (O intro) | O base | `ref-O-base.jpg` |
| 0.4 (S intro) | S base | `ref-S-base.jpg` |
| 0.5 (V intro) | V base | `ref-V-base.jpg` |
| 0.6 (E intro) | Ente | `ref-E-ente.jpg` |
| Ep.1 scene | D con bici | `ref-D-con-bici.jpg` |
| Ep.1 finale | D + figlio | `ref-D-con-figlio.jpg` |
| Ep.1 B | B con figlia | `ref-B-con-figlia.jpg` |
| Ep.2 D notebook | D con laptop | `ref-D-notebook.jpg` |
| Ep.3 B anziana | B anziana | `ref-B-anziana.jpg` |
| Ep.3 S con B | S + anziana | `ref-S-con-B-anziana.jpg` |
| Ep.3 D coperta | D con coperta | `ref-D-coperta.jpg` |
| O al bancone | O con tablet | `ref-O-bancone.jpg` |

---

## 🎬 SCENA 0 — Presentazione personaggi (7 clip)

Ogni clip dura **2 secondi** (sincronizzata con `vo-00-intro-*.mp3` da ~1.3s ciascuna).

### Scena 0.1 — D intro (0.0-2.0s) → `scena-00-01-intro-D.mp4`

**Reference**: `ref-D-base.jpg`
**Voice-over sync**: `vo-00-intro-D.mp3` ("Io sono il Donatore")
**Motion prompt**:
```
Character slowly turns toward camera, gentle welcoming smile appears, slight head nod. Static camera, soft golden light flickers on background. Pixar cartoon style.
```

### Scena 0.2 — B intro (2.0-4.0s) → `scena-00-02-intro-B.mp4`

**Reference**: `ref-B-base.jpg`
**Voice-over sync**: `vo-00-intro-B.mp3`
**Motion prompt**:
```
Character turns to camera with hopeful expression, hands join together in front of chest, soft smile. Subtle camera pan right. Warm pastel lighting.
```

### Scena 0.3 — O intro (4.0-6.0s) → `scena-00-03-intro-O.mp4`

**Reference**: `ref-O-base.jpg`
**Voice-over sync**: `vo-00-intro-O.mp3`
**Motion prompt**:
```
Character raises tablet slightly, looks at camera with trustworthy calm expression, blinks once. Static frame, soft focus on background tree.
```

### Scena 0.4 — S intro (6.0-8.0s) → `scena-00-04-intro-S.mp4`

**Reference**: `ref-S-base.jpg`
**Voice-over sync**: `vo-00-intro-S.mp3`
**Motion prompt**:
```
Character shows empathetic smile, slight head tilt, holds phone and tablet close to chest. Subtle parallax background.
```

### Scena 0.5 — V intro (8.0-10.0s) → `scena-00-05-intro-V.mp4`

**Reference**: `ref-V-base.jpg`
**Voice-over sync**: `vo-00-intro-V.mp3`
**Motion prompt**:
```
Character opens arms wide in welcoming gesture, big bright smile, eyes slightly close with joy. Static camera.
```

### Scena 0.6 — E intro (10.0-12.0s) → `scena-00-06-intro-E.mp4`

**Reference**: `ref-E-ente.jpg`
**Voice-over sync**: `vo-00-intro-E.mp3`
**Motion prompt**:
```
Building exterior with KYKOS logo on roof, warm light glows from windows, slight zoom out. Tree branches sway gently.
```

### Scena 0.7 — Zoom out finale (12.0-14.0s) → `scena-00-07-claim.mp4`

**Reference**: composizione custom (tutti i 6 insieme) — genera reference apposita
**Voice-over sync**: `vo-00-claim.mp3`
**Motion prompt**:
```
All 6 characters stand together under stylized tree, looking at each other and smiling. Camera slowly zooms out. Logo KYKOS appears with golden glow.
```

---

## 📖 EPISODIO 1 — "Il dono di Anna" (9 clip, ognuna ~4s)

### Scena 1.1 — In casa di D (0-4s) → `scena-01-ep1-casa-D.mp4`

**Reference**: `ref-D-con-bici.jpg`
**Voice-over sync**: `vo-01-ep1-casa-D.mp3` ("A volte abbiamo cose che non usiamo più...")
**Motion prompt**:
```
Father (40yo, blue D shirt) holds small bicycle, looks at it with bittersweet gentle smile. Sits on sofa next to 12yo boy with headphones ignoring the bike. Subtle camera pan left.
```

### Scena 1.2 — D scatta foto (4-8s) → `scena-01-ep1-foto.mp4`

**Reference**: `ref-D-con-bici.jpg`
**Voice-over sync**: `vo-01-ep1-foto.mp3`
**Motion prompt**:
```
Father holds phone up to bicycle, screen shows photo being taken. Big green "Offri" button pulses on phone screen. Father smiles with satisfaction.
```

### Scena 1.3 — In casa di B (8-12s) → `scena-01-ep1-casa-B.mp4`

**Reference**: `ref-B-con-figlia.jpg`
**Voice-over sync**: `vo-01-ep1-casa-B.mp3`
**Motion prompt**:
```
Mother (35yo, green B shirt) sits at table with 5yo daughter showing her a drawing of a bicycle. Mother looks at phone, sees photo of the bicycle, smiles warmly.
```

### Scena 1.4 — Sistema abbina (12-16s) → `scena-01-ep1-abbinamento.mp4`

**Reference**: nessuna (schermata UI astratta KYKOS)
**Voice-over sync**: `vo-01-ep1-abbinamento.mp3`
**Motion prompt**:
```
Abstract glowing KYKOS interface. Two cards (Offer and Request) move toward each other and merge into a golden heart pulse. Sparkle particles. No people visible.
```

### Scena 1.5 — D riceve QR (16-20s) → `scena-01-ep1-qr-D.mp4`

**Reference**: `ref-D-con-bici.jpg`
**Voice-over sync**: `vo-01-ep1-qr-D.mp3`
**Motion prompt**:
```
Father looks at phone with happy surprised expression. Phone screen shows bright golden QR code with heart icon. Notification "Offerta accolta" pulses softly.
```

### Scena 1.6 — Consegna all'ente (20-24s) → `scena-01-ep1-ente.mp4`

**Reference**: `ref-O-bancone.jpg`
**Voice-over sync**: `vo-01-ep1-ente.mp3`
**Motion prompt**:
```
Father walks up to entrance of building with KYKOS logo. Operator (orange O shirt) at counter scans QR code on tablet. Both smile, friendly handshake gesture.
```

### Scena 1.7 — B riceve QR (24-28s) → `scena-01-ep1-qr-B.mp4`

**Reference**: `ref-B-con-figlia.jpg`
**Voice-over sync**: `vo-01-ep1-qr-B.mp3`
**Motion prompt**:
```
Mother hugs daughter with joyful emotion. Phone in foreground shows golden QR code with "Regalo pronto" notification. Eyes slightly teary with happiness.
```

### Scena 1.8 — B ritira (28-32s) → `scena-01-ep1-ritiro.mp4`

**Reference**: `ref-B-con-figlia.jpg` + `ref-O-bancone.jpg`
**Voice-over sync**: `vo-01-ep1-ritiro.mp3`
**Motion prompt**:
```
Mother and daughter at counter of building. Operator hands gift box. Mother scans QR code on her phone. Daughter opens box and sees bicycle, joyful expression.
```

### Scena 1.9 — Finale split screen (32-38s) → `scena-01-ep1-finale.mp4`

**Reference**: composizione split screen
**Voice-over sync**: `vo-01-ep1-finale.mp3`
**Motion prompt**:
```
Split screen: LEFT side father (D blue) prepares snack for 12yo son at kitchen table, both smiling. RIGHT side mother (B green) rides bicycle with daughter on child seat in sunny park. Gentle camera movement on both sides.
```

---

## 📖 EPISODIO 2 — "Il desiderio di Marco" (9 clip, ognuna ~4s)

### Scena 2.1 — B sfoglia richieste (0-4s) → `scena-02-ep2-ricerca-B.mp4`

**Reference**: `ref-B-base.jpg`
**Voice-over sync**: `vo-02-ep2-ricerca-B.mp3`
**Motion prompt**:
```
Mother (B green shirt) scrolls through tablet showing KYKOS app, category Electronics. Types "Notebook" in search bar. No results. Slight disappointed expression, then thoughtful.
```

### Scena 2.2 — O verifica (4-8s) → `scena-02-ep2-ente-verifica.mp4`

**Reference**: `ref-O-bancone.jpg`
**Voice-over sync**: `vo-02-ep2-ente-verifica.mp3`
**Motion prompt**:
```
Operator (O orange) at desk reads tablet screen showing "Nuova richiesta". Smiles approvingly. Presses green "Autorizza" button. Smooth office lighting.
```

### Scena 2.3 — D propone (8-12s) → `scena-02-ep2-doppia-offerta.mp4`

**Reference**: `ref-D-notebook.jpg`
**Voice-over sync**: `vo-02-ep2-doppia-offerta.mp3`
**Motion prompt**:
```
Father (D blue) holds laptop (white, simplified) in front of phone camera, takes photo. Presses "Propongo" green button. Cautious hopeful expression. Clean white background.
```

### Scena 2.4 — Altre proposte (12-16s) → `scena-02-ep2-altre-proposte.mp4`

**Reference**: composizione tablet
**Voice-over sync**: `vo-02-ep2-altre-proposte.mp3`
**Motion prompt**:
```
Tablet screen close-up showing two cards side by side: "Notebook A" and "Notebook B" with stylized photos. Smooth scroll between them. No people visible.
```

### Scena 2.5 — B sceglie (16-20s) → `scena-02-ep2-scelta.mp4`

**Reference**: `ref-B-base.jpg`
**Voice-over sync**: `vo-02-ep2-scelta.mp3`
**Motion prompt**:
```
Mother (B green) touches one of the two cards on tablet. Green checkmark appears with small heart pulse. Determined gentle expression. Tablet glows softly.
```

### Scena 2.6 — D riceve QR (20-24s) → `scena-02-ep2-qr-D.mp4`

**Reference**: `ref-D-notebook.jpg`
**Voice-over sync**: `vo-02-ep2-qr-D.mp3`
**Motion prompt**:
```
Father (D blue) sees notification on phone "Proposta scelta!", golden QR appears. Smiles broadly, starts packing laptop in a box. Joyful energy.
```

### Scena 2.7 — Consegna (24-28s) → `scena-02-ep2-consegna.mp4`

**Reference**: `ref-O-bancone.jpg`
**Voice-over sync**: `vo-02-ep2-consegna.mp3`
**Motion prompt**:
```
Father arrives at building entrance with box. Operator (O orange) scans QR on tablet. Friendly handshake. Father leaves with empty hands and satisfied expression.
```

### Scena 2.8 — B ritira (28-32s) → `scena-02-ep2-ritiro.mp4`

**Reference**: `ref-B-base.jpg`
**Voice-over sync**: `vo-02-ep2-ritiro.mp3`
**Motion prompt**:
```
Mother (B green) at counter receives box, scans QR on phone. Opens box to reveal white laptop. Eyes fill with emotion. Soft golden light. Anonymous respect.
```

### Scena 2.9 — Finale con figlio (32-38s) → `scena-02-ep2-finale.mp4`

**Reference**: composizione B + figlio
**Voice-over sync**: `vo-02-ep2-finale.mp3`
**Motion prompt**:
```
Mother and son sitting together, laptop open showing school interface. Mother looks at son with loving proud expression. Warm lamp light. Soft camera zoom in.
```

---

## 📖 EPISODIO 3 — "Il dono per nonna Lucia" (9 clip, ognuna ~4s)

### Scena 3.1 — B anziana al tavolo (0-4s) → `scena-03-ep3-casa-B.mp4`

**Reference**: `ref-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-casa-B.mp3`
**Motion prompt**:
```
Elderly woman (80yo, beige cardigan) sits at kitchen table looking at thin blanket with cold gentle expression. Slight shiver. Warm but modest kitchen background.
```

### Scena 3.2 — S incontra B (4-8s) → `scena-03-ep3-incontro-S.mp4`

**Reference**: `ref-S-con-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-incontro-S.mp3`
**Motion prompt**:
```
Young woman (S purple) sits across table from elderly woman, takes notes on tablet with empathetic smile. Tea cup between them. Warm interior light. Soft gestures.
```

### Scena 3.3 — S pubblica richiesta (8-12s) → `scena-03-ep3-S-pubblica.mp4`

**Reference**: `ref-S-con-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-S-pubblica.mp3`
**Motion prompt**:
```
Close-up of tablet showing KYKOS app in "request on behalf of" mode. S types "Coperta pesante invernale", selects B from list, presses green "Invia richiesta" button. No faces visible.
```

### Scena 3.4 — Richiesta pubblicata (12-16s) → `scena-03-ep3-pubblicata.mp4`

**Reference**: schermata KYKOS astratta
**Voice-over sync**: `vo-03-ep3-pubblicata.mp3`
**Motion prompt**:
```
Abstract KYKOS feed interface. Request card "Coperta pesante invernale" appears with badge "Richiesta da street operator accreditato". Glowing borders. No people.
```

### Scena 3.5 — D propone (16-20s) → `scena-03-ep3-D-propongo.mp4`

**Reference**: `ref-D-coperta.jpg`
**Voice-over sync**: `vo-03-ep3-D-propongo.mp3`
**Motion prompt**:
```
Father (D blue) holds folded colorful wool blanket, positions it for phone photo. Presses green "Propongo" button. Clean white background. Hopeful expression.
```

### Scena 3.6 — S sceglie per B (20-24s) → `scena-03-ep3-S-accetta.mp4`

**Reference**: `ref-S-con-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-S-accetta.mp3`
**Motion prompt**:
```
S shows tablet photo of blanket to elderly woman at table. B nods with satisfied smile. S presses "Accetta" green button. Heart icon pulse on screen.
```

### Scena 3.7 — Consegna ente (24-28s) → `scena-03-ep3-ente-sicuro.mp4`

**Reference**: `ref-O-bancone.jpg`
**Voice-over sync**: `vo-03-ep3-ente-sicuro.mp3`
**Motion prompt**:
```
Quick sequence: D delivers blanket to O at counter (scan QR). Same time S receives QR notification on tablet. Two parallel scenes in split screen. Smooth cross-fade.
```

### Scena 3.8 — S porta a casa (28-32s) → `scena-03-ep3-S-porta-casa.mp4`

**Reference**: `ref-S-con-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-S-porta-casa.mp3`
**Motion prompt**:
```
Split screen sequential: FIRST S receives bag from O at building entrance. SECOND S rings doorbell at modest apartment building, B opens door, S hands her the bag. Elderly woman smiles with deep gratitude.
```

### Scena 3.9 — Finale pace (32-38s) → `scena-03-ep3-finale.mp4`

**Reference**: `ref-B-anziana.jpg`
**Voice-over sync**: `vo-03-ep3-finale.mp3`
**Motion prompt**:
```
Elderly woman wrapped in thick colorful wool blanket on sofa, eyes closed with peaceful smile. Outside window, snowflakes fall slowly. Warm lamp light. S waves from doorway in background.
```

---

## 🎴 CARD FINALE (1 clip, 4s)

### Card finale → `scena-finale-card.mp4`

**Reference**: composizione tutti i 6 personaggi + logo
**Voice-over sync**: `vo-finale-claim.mp3`
**Motion prompt**:
```
White background. KYKOS logo appears in center with golden glow. Below: tagline "Donare è semplice. È anonimo. È KYKOS." fades in. Below: kykos.it URL. Top: small stylized icons of all 6 characters. Slow gentle zoom out.
```

---

## 🎬 Workflow Pika Labs passo-passo

### Step 1 — Setup account
1. Vai su [pika.art](https://pika.art)
2. Crea account (Google login)
3. Scegli piano **Standard $10/mese** (o Pro $35/mese se vuoi quality top)
4. Hai ~700 credit/mese = ~50-100 clip da 4s

### Step 2 — Carica reference
1. Clicca **"Create"** → **"Image-to-Video"**
2. Upload della reference JPG (es. `ref-D-con-bici.jpg`)
3. Nel campo **"Prompt"** incolla il motion prompt della scena
4. **Settings**:
   - Duration: **4s**
   - Aspect ratio: **16:9**
   - Motion strength: **2** (per scene calme)
   - FPS: **24**
   - Seed: fisso per personaggio (opzionale)

### Step 3 — Genera e scarica
1. Clicca **"Generate"**
2. Attendi 30-90s
3. Guarda il risultato → se non va bene, rigenera con stesso seed o seed diverso
4. Clicca **"Download"** → salva come `scena-NN-epX-soggetto.mp4`
5. Salva in `D:\PROGETTI\KYKOS\KYKOS-WITH-CLAUDE\assets\video-1\senes\`

### Step 4 — Verifica qualità
Per ogni clip:
- [ ] Stile coerente con reference (Pixar cartoon, NO realismo)
- [ ] Movimento morbido (no scatti, no zoom aggressivo)
- [ ] Durata 4-5s esatti
- [ ] Sincronizzabile con clip voice-over
- [ ] Nessun brand/logo visibile (no Apple, no Google, no etc.)
- [ ] Anonimato KYKOS rispettato (solo lettere D/B/O/S/V/E)

### Step 5 — Rinomina e organizza
Salva in `assets/video-1/scenes/` con naming convention:
- `scena-00-01-intro-D.mp4`
- `scena-00-02-intro-B.mp4`
- ...
- `scena-01-ep1-casa-D.mp4`
- ...
- `scena-finale-card.mp4`

---

## ⚠️ Errori comuni Pika Labs

| ❌ Errore | ✅ Soluzione |
|---|---|
| Risultato troppo realistico | Aggiungi "PIXAR CARTOON STYLE" all'inizio del prompt |
| Movimento troppo veloce | Riduci motion strength a 1-2 |
| Zoom aggressivo | Aggiungi "static camera" al prompt |
| Personaggio cambia aspetto | Fixa il seed e riusa la stessa reference |
| Durata sbagliata | Pika supporta solo 3s, 5s, 7s, 10s → usa 5s e tagli in editing |
| Testo/branding appare | Aggiungi al negative: "text, watermark, brand, logo" |
| Sfondo realistico | Aggiungi "white background, simple composition" |
| Anonimato KYKOS violato | Controlla sempre: solo lettere D/B/O/S/V/E visibili |

---

## 📊 Checklist finale pipeline

- [ ] 35 clip video generate e salvate in `assets/video-1/scenes/`
- [ ] Tutte coerenti con reference originali
- [ ] Tutte con motion strength 2-3 (movimenti semplici)
- [ ] Tutte in 16:9 1920×1080
- [ ] Stile Pixar/Ghibli uniforme
- [ ] Anonimato KYKOS verificato scena per scena
- [ ] Nessun brand visibile
- [ ] Pronte per DaVinci Resolve (Fase 5 montaggio)

---

## 🎯 Prossima fase

Dopo aver generato tutte le clip video, dimmelo e ti guido sulla **Fase 5 (montaggio DaVinci Resolve)**: timeline con 35 audio + 35 video + ducking musica.

---

**Versione**: 1.0 — 16 settembre 2026
**Tool target**: Pika Labs 2.0 image-to-video
**Tempo stimato generazione**: ~3-5 ore (35 clip × 5-10 min l'una con retry)
**Costo stimato**: $10/mese Standard basta per tutte le 35 clip

### Fonti

- [Pika Labs 2.0 Documentation](https://pika.art)
- [Pika Image-to-Video Best Practices](https://pika.art/create)
- Sincronizzazione con `assets/video-1/voiceover/SCRIPT.md` (35 clip già pronte)
- Mapping scene da `docs/VIDEO-1-SCENEGGIATURA.md`
