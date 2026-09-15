# I 6 Prompt da Rigenerare — KYKOS Video 1

> **File separato da `PROMPTS.md`** — contiene SOLO i prompt da usare adesso su Leonardo AI per rifare le 6 reference incoerenti. Diagnosi e teoria restano in `PROMPTS.md`.

---

## 📊 Stato al 15/09 sera

| # | File | Stato Round 1 | Azione |
|---|------|---------------|--------|
| 1 | `ref-B-anziana.jpg` | ✅ **PRONTA** | nessuna |
| 2 | `ref-B-bici.jpg` | ❌ FALLITA (vecchia, 14/09) | Round 2 (prompt 2-bis) |
| 3 | `ref-D-notebook.jpg` | ❌ iPhone con Apple logo | Round 2 (prompt 1-bis) |
| 4 | `ref-D-coperta.jpg` | ❌ iPhone con Apple logo | Round 2 (prompt 4-bis) |
| 5 | `ref-O-bancone.jpg` | ✅ **PRONTA** | nessuna |
| 6 | `ref-S-con-B-anziana.jpg` | ✅ **PRONTA** | nessuna |

➡️ Le 3 ancora da rifare sono nel **Round 2** in fondo a questo file.

---

## 🚀 Mini-guida Leonardo AI (5 step)

### Step 1 — Apri Leonardo AI
Vai su [leonardo.ai](https://leonardo.ai) → login → **AI Image Generation**.

### Step 2 — Scegli il modello
In alto a destra c'è il selettore modelli. Cerca e seleziona:
**`Phoenix 1.0`** → poi imposta la modalità **`Quality`** (NON "Fast", è fondamentale)

> 💡 Se non trovi Phoenix 1.0, usa **`GPT-Image-1`** come fallback.

### Step 3 — Negative Prompt (sempre lo stesso per tutti e 6)
Nel campo **"Negative Prompt"** (in basso nella pagina di generazione) incolla ESATTAMENTE questo blocco:

```
realistic, photorealistic, photographic, photograph, photo, hyperrealistic,
ultra detailed skin, pore texture, blemish, real human face, real person,
3d render, cgi, 3d model, octane render, unreal engine, ray tracing,
cinematic, film still, movie still, DSLR, sharp focus photography,
depth of field, bokeh, lens flare,
Apple, iPhone, iPad, MacBook, brand logo, trademark,
dark, gritty, violent, scary, horror, mature content,
text, watermark, signature, blurry, low quality, deformed,
extra limbs, extra fingers, mutated hands, bad anatomy
```

### Step 4 — Prompt positivo (cambia per ogni reference)
Nel campo **"Prompt"** (in alto) incolla il prompt corrispondente al file che vuoi rigenerare. Sono tutti sotto.

### Step 5 — Impostazioni e generazione
- **Resolution**: `1024 × 1024` (quadrato)
- **Guidance Scale**: `7` (default va bene)
- **Numero immagini**: `4` (scegli la migliore)
- Clicca **Generate**
- Scarica quella che supera i 8 controlli della checklist (in fondo a `PROMPTS.md`)

---

## 📋 I 6 Prompt (copia-incolla)

Sotto ogni prompt trovi il **nome file esatto** da salvare (sostituisce la versione problematica).

---

### 1️⃣ ref-B-anziana.jpg — NONNA DI B (Ep. 3)

> La nonna è ANONIMA: niente lettera/maglietta KYKOS, è una persona reale assistita dallo street operator.

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft golden hour lighting,
isolated on PURE WHITE BACKGROUND, full body character portrait,
looking at camera, soft rounded shapes, gentle and warm atmosphere,
2D art, animated movie style, NOT realistic, NOT photographic,
simplified features, smooth skin texture, illustrated not rendered.

Italian elderly woman, age 80, white hair in a soft bun, kind
STYLIZED face with simplified soft lines (NOT detailed wrinkles).
Wearing a SIMPLE WOOL CARDIGAN in BEIGE/CREAM color (NOT purple,
NOT any other bright color) over a plain light blouse. She is
holding a thin warm blanket in her hands, looking down at it with
a slightly cold gentle expression. NO letter on shirt, NO text
anywhere. SIMPLE flat minimal background (no detailed kitchen).
```

**Salva come**: `assets/video-1/references/ref-B-anziana.jpg`

---

### 2️⃣ ref-B-bici.jpg — B SU BICI CON FIGLIA (Ep. 1, finale)

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, sunny park lighting, isolated on
PURE WHITE BACKGROUND (no detailed trees or park),
motion implied, joyful mood, soft rounded shapes, gentle and warm
atmosphere, 2D art, animated movie style, NOT realistic,
NOT photographic, illustrated not rendered.

Italian woman, age 35, brown hair, wearing plain green cotton
t-shirt with a big bold white capital letter "B" centered on the
chest (the B is the ONLY text visible in the entire image).
Riding a small children's bicycle (slightly used but well-maintained,
simplified flat illustration). A 5-year-old girl sits on a child
seat at the back, laughing with arms slightly out. Motion implied,
joyful mood.
```

**Salva come**: `assets/video-1/references/ref-B-bici.jpg`

---

### 3️⃣ ref-D-notebook.jpg — D CON LAPTOP (Ep. 2)

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft natural lighting, isolated on
PURE WHITE BACKGROUND (no detailed office), soft rounded shapes,
gentle and warm atmosphere, 2D art, animated movie style,
NOT realistic, NOT photographic, illustrated not rendered.

Italian man, age 40, kind face, short dark hair, wearing plain
blue cotton t-shirt with a big bold white capital letter "D"
centered on the chest (the D is the ONLY text visible anywhere).
He is holding a STYLIZED FLAT LAPTOP (white, simplified, no brand,
NO text or logo on the screen) open in front of him. He's
positioning the laptop toward the camera as if taking a photo
of it with a SIMPLIFIED FLAT PHONE (NO Apple logo, NO specific
brand, just a generic stylized phone shape).
```

**Salva come**: `assets/video-1/references/ref-D-notebook.jpg`

---

### 4️⃣ ref-D-coperta.jpg — D CON COPERTA (Ep. 3)

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft natural lighting, isolated on
PURE WHITE BACKGROUND (no detailed bedroom or wardrobe),
soft rounded shapes, gentle and warm atmosphere, 2D art,
animated movie style, NOT realistic, NOT photographic,
illustrated not rendered.

Italian man, age 40, kind face, short dark hair, wearing plain
blue cotton t-shirt with a big bold white capital letter "D"
centered on the chest (the D is the ONLY text visible).
Holding a folded thick wool blanket with colorful warm pattern
(in good condition, simplified flat illustration). He's
positioning the blanket toward the camera as if taking a photo
of it with a SIMPLIFIED FLAT PHONE (NO Apple logo, NO specific
brand, just a generic stylized phone shape).
```

**Salva come**: `assets/video-1/references/ref-D-coperta.jpg`

---

### 5️⃣ ref-O-bancone.jpg — O AL BANCONE DELL'ENTE (Ep. 1/2/3)

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft interior lighting, isolated on
PURE WHITE BACKGROUND (no detailed entrance hall), soft rounded
shapes, gentle and warm atmosphere, 2D art, animated movie style,
NOT realistic, NOT photographic, illustrated not rendered.

Italian man, age 50, mature face, grey hair short cut, glasses,
wearing plain orange cotton t-shirt with a big bold white capital
letter "O" centered on the chest. IMPORTANT: the letter "O" on the
shirt is the ONLY text and ONLY letter "O" visible in the entire
image (NO other letters, NO symbols next to it, NO watermark).
He is holding a STYLIZED FLAT TABLET (simplified geometric
shapes, NO Apple logo, NO brand, NO real iPad design) showing
just abstract colorful shapes representing a QR scanner interface.
Trustworthy calm expression.
```

**Salva come**: `assets/video-1/references/ref-O-bancone.jpg`

---

### 6️⃣ ref-S-con-B-anziana.jpg — S CON B ANZIANA (Ep. 3)

> ⚠️ Qui ci sono DUE persone: S (street operator, maglietta VIOLA) + la nonna di B (cardigan BEIGE, NON viola!).

**Negative Prompt**: (vedi Step 3 sopra)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft interior lighting, isolated on
PURE WHITE BACKGROUND (no detailed kitchen), soft rounded shapes,
gentle and warm atmosphere, 2D art, animated movie style,
NOT realistic, NOT photographic, illustrated not rendered.

TWO people sitting at a SIMPLE WOODEN TABLE.

On the LEFT: Italian woman, age 30, short curly dark hair,
wearing plain purple/violet cotton t-shirt with a big bold white
capital letter "S" centered on the chest (the S is the ONLY text
visible on her). Holding a STYLIZED FLAT TABLET (simplified,
NO Apple logo, NO brand, just geometric shapes) showing a simple
green button shape. Empathetic engaged friendly expression.

On the RIGHT: Italian elderly woman, age 80, white hair in bun,
STYLIZED kind simplified face (NOT detailed wrinkles). Wearing
a NEUTRAL BEIGE/CREAM CARDIGAN over a plain light blouse
(CRITICAL: the cardigan is BEIGE/CREAM, NOT purple, NOT any other
bright color — purple is reserved for character S). Leaning
slightly toward the young woman with a hopeful expression.
```

**Salva come**: `assets/video-1/references/ref-S-con-B-anziana.jpg`

---

## ⚠️ Round 2 — Le 3 ANCORA problematiche (15/09 audit)

Dopo audit del 15/09 sera, 3 delle 6 rigenerate hanno ancora problemi:

| File | Problema residuo | Soluzione Round 2 |
|------|------------------|---------------------|
| `ref-D-notebook.jpg` | Cartoon OK, MA iPhone con **Apple logo visibile** + libreria realistica | Telefono descritto come "plain rectangle, no screen, no logo, no camera" |
| `ref-D-coperta.jpg` | Stesso problema iPhone con Apple logo | Stessa soluzione |
| `ref-B-bici.jpg` | **NON è stata rigenerata** (data file 14/09) — è ancora il render 3D vecchio | Prompt v2 + provare modello `GPT-Image-1` o `Seedream 4.5` invece di Phoenix |

### Negative prompt RAFFORZATO v2 (per questi 3)

```
realistic, photorealistic, photographic, photograph, photo, hyperrealistic,
ultra detailed skin, pore texture, blemish, real human face, real person,
3d render, cgi, 3d model, octane render, unreal engine, ray tracing,
cinematic, film still, movie still, DSLR, sharp focus photography,
depth of field, bokeh, lens flare,
Apple, iPhone, iPad, MacBook, smartphone, cellphone, mobile phone,
mobile device, iOS device, brand logo, trademark,
dark, gritty, violent, scary, horror, mature content,
text, watermark, signature, blurry, low quality, deformed,
extra limbs, extra fingers, mutated hands, bad anatomy
```

> **Differenza vs Round 1**: aggiunte le parole `smartphone, cellphone, mobile phone, mobile device, iOS device` per bloccare la categoria intera, non solo i marchi.

### 1️⃣-bis ref-D-notebook.jpg — D CON LAPTOP (Round 2)

**Modello**: prova **`GPT-Image-1`** (meno photorealistic di Phoenix)
**Negative Prompt**: (vedi sopra, v2)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft natural lighting, isolated on
PURE WHITE BACKGROUND (no office, no bookshelves, no furniture),
soft rounded shapes, gentle and warm atmosphere, 2D art,
animated movie style, NOT realistic, NOT photographic,
illustrated not rendered.

Italian man, age 40, kind face, short dark hair, wearing plain
blue cotton t-shirt with a big bold white capital letter "D"
centered on the chest (the D is the ONLY text visible anywhere).
He is holding a STYLIZED FLAT WHITE LAPTOP (simplified geometric
rectangle, completely BLANK SCREEN, no brand, no logo, no text).
He's also holding a PLAIN BLACK RECTANGLE (NOT a smartphone, NOT
a phone, NOT iOS — just a simple flat black rectangle with no
camera, no screen, no buttons, no logo — pure abstract shape
representing a phone). SIMPLE flat minimal background.
```

---

### 4️⃣-bis ref-D-coperta.jpg — D CON COPERTA (Round 2)

**Modello**: prova **`GPT-Image-1`**
**Negative Prompt**: (vedi sopra, v2)

**Prompt**:
```
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft natural lighting, isolated on
PURE WHITE BACKGROUND (no bedroom, no wardrobe, no furniture),
soft rounded shapes, gentle and warm atmosphere, 2D art,
animated movie style, NOT realistic, NOT photographic,
illustrated not rendered.

Italian man, age 40, kind face, short dark hair, wearing plain
blue cotton t-shirt with a big bold white capital letter "D"
centered on the chest (the D is the ONLY text visible).
Holding a folded thick wool blanket with colorful warm pattern
(simplified flat illustration). He's positioning the blanket
toward the camera and in his other hand a PLAIN BLACK RECTANGLE
(NOT a smartphone, NOT a phone, NOT iOS — just a simple flat
black rectangle with no camera, no screen, no buttons, no logo
— pure abstract shape representing a phone).
```

---

### 2️⃣-bis ref-B-bici.jpg — B SU BICI CON FIGLIA (Round 2)

**Modello**: prova **`Seedream 4.5`** (più illustrativo, meno photorealistic)
oppure **`GPT-Image-1`**
**Negative Prompt**: (vedi sopra, v2)

**Prompt**:
```
flat 2D cartoon illustration, illustrated in the style of a
children's picture book, soft outlines, pastel colors,
warm and joyful mood, isolated on PURE WHITE BACKGROUND
(NO trees, NO park, NO buildings, NO detailed environment —
just white empty space), simple flat composition.

Italian woman, age 35, short brown hair, wearing plain green
cotton t-shirt with a big bold white capital letter "B" centered
on the chest (the B is the ONLY text visible). She is riding
a small simple bicycle (flat 2D illustration style, NOT realistic
bike, NOT photorealistic). A 5-year-old girl with brown pigtails
sits behind her on a child seat, smiling. Both characters shown
from waist up, simple clean cartoon style. Joyful motion implied
through hair flowing.
```

> **Differenza vs Round 1**: niente descrizione di "park", "trees", "dirt path" → solo "PURE WHITE BACKGROUND". E la bici descritta come "flat 2D illustration" invece di "slightly used but well-maintained" (che aveva attivato il render realistico).

---

## ✅ Checklist pre-accettazione (rapida)

Prima di salvare una generazione, confrontala con `ref-D-base.jpg` (il benchmark di stile). Scarta l'immagine se ANCHE SOLO UNO di questi punti fallisce:

- [ ] Stile coerente con `ref-D-base.jpg` (Pixar-style, palette calda)
- [ ] La persona NON sembra una fotografia vera
- [ ] Sfondo stilizzato/astratto o bianco (no scene realistiche dettagliate)
- [ ] L'unico testo visibile è la lettera sulla maglietta del personaggio
- [ ] I colori dei vestiti sono quelli giusti (no inversioni)
- [ ] Nessun brand visibile (no Apple, no iPhone, no logo)
- [ ] Espressione del viso semplificata (non fotorealistica)
- [ ] La lettera sulla maglietta è leggibile e non deformata

---

## 🔄 Se una generazione continua a venire realistica

1. **Rigenera altre 4 varianti** (a volte servono 2-3 tentativi)
2. **Aggiungi al negative prompt**: `lifelike, photogenic, beauty shot, portrait photography`
3. **Aumenta Guidance Scale** a `9` (costringe l'AI a seguire di più il prompt)
4. Se dopo 3 tentativi non funziona, prova a **passare a `GPT-Image-1`** (più "anime", meno incline al fotorealismo)

---

**Versione**: 1.0 — 15 settembre 2026
**Stato**: pronto all'uso
