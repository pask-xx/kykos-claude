# Prompt Reference — KYKOS Video 1

> Prompt ottimizzati per generare le reference visive dei personaggi con AI.
> Strumenti consigliati: **Midjourney v6** (migliore per cartoon coerente), **Leonardo AI** (alternativa gratuita), **DALL-E 3** (incluso in ChatGPT Plus).

---

## ⚠️ Come ottenere lo stile CARTOON (non realistico) su Leonardo AI

Il catalogo modelli di Leonardo AI è cambiato nel 2026. Ecco i modelli **attualmente disponibili** adatti a cartoon/illustrazione:

| Modello | Stile | Per KYKOS |
|---------|-------|-----------|
| ⭐ **Phoenix 1.0** (Leonardo proprietario) | Cartoon stilizzato occidentale | **CONSIGLIATO** — Pixar-style |
| **GPT-Image-1** (OpenAI) | Anime / Studio Ghibli | **Alternativa valida** — più "anime", meno Pixar |
| **Ideogram 4.0** | Flat 2D con testo/logo | Ottimo se ti serve precisione testo (le lettere sulle magliette) |
| **Lucid Origin** (Leonardo proprietario) | Concept art versatile | Buono, generalista |
| **Seedream 4.5** | Illustrazione commerciale alta res | Per stampe/finali ad alta qualità |
| **Recraft V4** | Visual pronti produzione | Alternativa precisa |
| ❌ **PhotoReal, Absolute Reality** | Realistico | **NON usare** |

### Step 1: Scegli il modello GIUSTO

1. Apri **Leonardo AI**
2. Vai su **"AI Image Generation"**
3. Nel selettore modelli (in alto), cerca e seleziona nell'ordine:
   - **Prima scelta**: `Phoenix 1.0` (in modalità "Quality")
   - **Seconda scelta**: `GPT-Image-1` (per stile anime/Ghibli)
   - **Terza scelta**: `Ideogram 4.0` (se ti serve precisione sulle lettere)
4. **Trucco rapido**: lascia il selettore su **"Auto"** — Leonardo sceglierà il modello migliore per il prompt

### Step 2: Negative prompt aggressivo

Copia questo nel campo "Negative Prompt" (è fondamentale per bloccare il fotorealismo):

```
realistic, photorealistic, photographic, 3d render, cgi, 3d model, octane render,
unreal engine, hyperrealistic, ultra detailed skin, pore texture, blemish,
real human face, photo, photography, sharp focus photography,
dark, gritty, violent, scary, horror, mature content,
text, watermark, signature, logo, blurry, low quality, deformed,
extra limbs, extra fingers, mutated hands, bad anatomy
```

### Step 3: Impostazioni raccomandate

- **Resolution**: 1024×1024 (quadrato, versatile)
- **Guidance Scale**: 7-9 (più alto = segue di più il prompt)
- **Numero immagini**: 4 per generazione (scegli la migliore)

### Step 4: Prompt rafforzato

Usa i prompt sotto sostituendo lo STYLE_PREFIX con la versione "Leonardo-friendly" che forza il 2D.

---

## Stile unificato (PREFIX da anteporre a OGNI prompt)

### Per Midjourney / DALL-E

```
Cartoon 2D style, inspired by Pixar and Studio Ghibli, soft watercolor textures,
pastel warm color palette, soft golden hour lighting, clean composition,
character design sheet style, isolated on pure white background,
full body character portrait, looking at camera, friendly approachable expression,
no text overlay except the letter on the shirt, soft rounded shapes,
no harsh lines, gentle and warm atmosphere.
```

### Per Leonardo AI (versione RAFFORZATA anti-realismo)

```
flat 2D cartoon illustration, pixar style, disney style, studio ghibli style,
hand-drawn animation, cel shading, vector art style, clean lineart,
bold simple shapes, soft watercolor textures, pastel warm color palette,
soft golden hour lighting, clean composition, character design sheet style,
isolated on pure white background, full body character portrait, looking at
camera, friendly approachable expression, no text overlay except the letter
on the shirt, soft rounded shapes, no harsh lines, gentle and warm atmosphere,
illustration not photograph, drawn not photographed, animated movie style,
not realistic, not photographic, 2D art, flat illustration
```

> ⚠️ **Importante**: il PREFIX mantiene la **coerenza visiva** tra i 6 personaggi. Usalo sempre.

---

## Reference base — 5 personaggi + 1 edificio

### D — Donatore (uomo 40, maglietta BLU con "D")

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Full body portrait of an Italian man, age 40, kind face with short dark hair,
a few grey temples, light stubble. Wearing a plain blue cotton t-shirt with
a big bold white capital letter "D" centered on the chest, blue jeans,
simple sneakers. Standing in a neutral relaxed pose, looking at camera
with a warm gentle smile. Height proportion standard adult male. The "D"
on the shirt is the ONLY text visible.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Leonardo Illustration XL
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, isolated on pure white background, full body character portrait,
looking at camera, friendly warm gentle smile, soft rounded shapes, no harsh
lines, gentle and warm atmosphere, 2D art, animated movie style, not realistic.

Italian man, age 40, kind face, short dark hair, light grey temples, light
stubble. Wearing plain blue cotton t-shirt with a big bold white capital
letter "D" centered on the chest, blue jeans, simple sneakers. Standing in
neutral relaxed pose. The "D" on the shirt is the ONLY text visible.
```

**Nome file output**: `ref-D-base.png` (o `.jpg`/`.jpeg` se Leonardo AI scarica così)

---

### B — Beneficiario (donna 35, maglietta VERDE con "B")

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Full body portrait of an Italian woman, age 35, oval face, brown hair tied
in a low ponytail, soft features. Wearing a plain green cotton t-shirt with
a big bold white capital letter "B" centered on the chest, dark trousers,
simple flat shoes. Standing in a neutral relaxed pose, looking at camera
with an open hopeful expression. Height proportion standard adult female.
The "B" on the shirt is the ONLY text visible.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, isolated on pure white background, full body character portrait,
looking at camera, friendly open hopeful expression, soft rounded shapes,
no harsh lines, gentle and warm atmosphere, 2D art, animated movie style,
not realistic.

Italian woman, age 35, oval face, brown hair tied in low ponytail, soft
features. Wearing plain green cotton t-shirt with a big bold white capital
letter "B" centered on the chest, dark trousers, simple flat shoes.
Standing in neutral relaxed pose. Height proportion standard adult female.
The "B" on the shirt is the ONLY text visible.
```

**Nome file output**: `ref-B-base.png` (o `.jpg`/`.jpeg` se Leonardo AI scarica così)

---

### O — Operatore ente (uomo 50, maglietta ARANCIONE con "O")

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Full body portrait of an Italian man, age 50, mature face with grey hair
short cut, glasses, neat professional look. Wearing a plain orange cotton
t-shirt with a big bold white capital letter "O" centered on the chest,
dark trousers, dark shoes. Holding a tablet under one arm in a casual way.
Standing in a neutral professional pose, looking at camera with a
trustworthy calm expression. The "O" on the shirt is the ONLY text visible.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, isolated on pure white background, full body character portrait,
looking at camera, trustworthy calm professional expression, soft rounded
shapes, no harsh lines, gentle and warm atmosphere, 2D art, animated movie
style, not realistic.

Italian man, age 50, mature face with grey hair short cut, glasses, neat
professional look. Wearing plain orange cotton t-shirt with a big bold
white capital letter "O" centered on the chest, dark trousers, dark shoes.
Holding a tablet under one arm in a casual way. Standing in neutral
professional pose. The "O" on the shirt is the ONLY text visible.
```

**Nome file output**: `ref-O-base.png` (o `.jpg`/`.jpeg`)

---

### S — Street Operator (donna 30, maglietta VIOLA con "S")

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Full body portrait of an Italian woman, age 30, energetic face with short
curly dark hair, friendly smile. Wearing a plain purple/violet cotton
t-shirt with a big bold white capital letter "S" centered on the chest,
practical trousers, comfortable shoes. Carrying a small messenger bag
with a tablet peeking out. Standing in a neutral dynamic pose, looking at
camera with an empathetic engaged expression. The "S" on the shirt is
the ONLY text visible.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, isolated on pure white background, full body character portrait,
looking at camera, empathetic engaged friendly smile, soft rounded shapes,
no harsh lines, gentle and warm atmosphere, 2D art, animated movie style,
not realistic.

Italian woman, age 30, energetic face with short curly dark hair, friendly
smile. Wearing plain purple/violet cotton t-shirt with a big bold white
capital letter "S" centered on the chest, practical trousers, comfortable
shoes. Carrying a small messenger bag with a tablet peeking out. Standing
in neutral dynamic pose. The "S" on the shirt is the ONLY text visible.
```

**Nome file output**: `ref-S-base.png` (o `.jpg`/`.jpeg`)

---

### V — Volontario (ragazzo 25, maglietta GIALLA con "V")

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Full body portrait of an Italian young man, age 25, athletic build,
friendly face with short messy hair. Wearing a plain yellow cotton
t-shirt with a big bold white capital letter "V" centered on the chest,
khaki shorts, sneakers. Arms slightly open in a welcoming gesture.
Standing in a neutral open pose, looking at camera with an enthusiastic
genuine smile. The "V" on the shirt is the ONLY text visible.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, isolated on pure white background, full body character portrait,
arms slightly open in a welcoming gesture, enthusiastic genuine smile,
soft rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic.

Italian young man, age 25, athletic build, friendly face with short messy
hair. Wearing plain yellow cotton t-shirt with a big bold white capital
letter "V" centered on the chest, khaki shorts, sneakers. Standing in
neutral open pose, looking at camera. The "V" on the shirt is the ONLY
text visible.
```

**Nome file output**: `ref-V-base.png` (o `.jpg`/`.jpeg`)

---

### E — Ente (edificio stilizzato)

#### Prompt Midjourney / DALL-E

```
[STYLE_PREFIX]
Exterior view of a small Italian-style community building, two stories
high, light beige/cream walls, terracotta roof tiles, large arched
wooden entrance door, two big windows on the ground floor with warm
golden light coming from inside. A glowing circular logo (intertwined K
letters, gold on blue) sits prominently on top of the roof, like a sign.
A small wooden sign next to the door reads "Centro KYKOS" in stylized
handwriting. Daytime with blue sky, a few stylized clouds, soft warm
lighting. Welcoming and homely atmosphere. Cozy Italian architecture.
```

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1 o Ideogram 4.0 (Ideogram è ottimo per architettura flat)
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, photo, photography, dark, gritty, violent, watermark, signature, blurry, low quality, deformed

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft golden hour
lighting, clean composition, character design sheet style, isolated on
pure white background, no text overlay, soft rounded shapes, no harsh
lines, gentle and warm atmosphere, 2D art, animated movie style, not
realistic.

Exterior view of a small Italian-style community building, two stories
high, light beige/cream walls, terracotta roof tiles, large arched wooden
entrance door, two big windows on the ground floor with warm golden light
coming from inside. A glowing circular logo (intertwined K letters, gold
on blue) sits prominently on top of the roof, like a sign. A small wooden
sign next to the door. Daytime with blue sky, a few stylized clouds, soft
warm lighting. Welcoming and homely atmosphere. Cozy Italian architecture.
```

**Nome file output**: `ref-E-base.png` (o `.jpg`/`.jpeg`)

---

## Varianti pose — per scene specifiche

### D con bicicletta (Ep. 1, scena 1)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, warm afternoon light
from window, soft rounded shapes, no harsh lines, gentle and warm
atmosphere, 2D art, animated movie style, not realistic, Italian living
room interior, modest cozy domestic scene.

Italian man, age 40, kind face, short dark hair, wearing plain blue cotton
t-shirt with a big bold white capital letter "D" centered on the chest.
Standing in his living room, holding a small children's bicycle with
visible wear (light scratches, worn handlebar grips, faded but recognizable
colors, slightly used but well-maintained). Looking at the bicycle with a
tender bittersweet smile. The "D" on the shirt is the ONLY text visible.
```

**Output**: `ref-D-bici.png` (o `.jpg`/`.jpeg`)

---

### B con figlia 5 anni (Ep. 1, scene 3, 7, 8)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft lighting, soft
rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic, Italian kitchen interior, modest cozy
domestic background, wooden table.

Italian woman, age 35, brown hair in low ponytail, wearing plain green
cotton t-shirt with a big bold white capital letter "B" centered on the
chest. Sitting at a kitchen table with a 5-year-old girl (her daughter)
on her lap. The little girl is holding up a crayon drawing of a bicycle,
smiling proudly. The mother looks at the drawing with a soft smile. The
"B" on the shirt is the ONLY text visible.
```

**Output**: `ref-B-bambina.png` (o `.jpg`/`.jpeg`)

---

### B anziana — nonna Lucia (Ep. 3, scene 1, 2, 8, 9)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft lighting, soft
rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic, simple modest Italian kitchen
background, warm but frugal atmosphere, wooden table.

Italian elderly woman, age 80, white hair pulled back in a bun, kind
wrinkled face, wearing a simple wool cardigan over a beige blouse. She is
sitting at a small kitchen table, holding a thin worn blanket in her
hands, looking down at it with a slightly cold expression. NO letter on
shirt (this is the "real" version of B without identification).
```

**Output**: `ref-B-anziana.png` (o `.jpg`/`.jpeg`)

> ⚠️ Nota: in questa variante B è **anonima** (senza lettera/maglietta KYKOS) perché rappresenta una persona reale assistita dallo street operator.

---

### B su bici con figlia (Ep. 1, scena 9 finale)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, sunny park lighting,
dirt path with trees, motion implied, joyful mood, soft rounded shapes, no
harsh lines, gentle and warm atmosphere, 2D art, animated movie style, not
realistic.

Italian woman, age 35, brown hair, wearing plain green cotton t-shirt with
a big bold white capital letter "B" centered on the chest. Riding a small
children's bicycle (slightly used but well-maintained). A 5-year-old girl
sits on a child seat at the back, laughing with arms slightly out. Motion
implied, joyful mood. The "B" on the shirt is the ONLY text visible.
```

**Output**: `ref-B-bici.png` (o `.jpg`/`.jpeg`)

---

### D con notebook (Ep. 2, scena 3)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft natural lighting,
soft rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic, Italian home office or living room
interior, neutral background.

Italian man, age 40, kind face, short dark hair, wearing plain blue cotton
t-shirt with a big bold white capital letter "D" centered on the chest.
Sitting at a desk, holding a white notebook laptop open in front of him.
He's positioning the laptop toward the camera as if taking a photo of it
with his smartphone (visible in his other hand). The "D" on the shirt is
the ONLY text visible.
```

**Output**: `ref-D-notebook.png` (o `.jpg`/`.jpeg`)

---

### D con coperta (Ep. 3, scena 5)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft natural lighting,
soft rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic, Italian bedroom interior with
wardrobe, neutral background.

Italian man, age 40, kind face, short dark hair, wearing plain blue cotton
t-shirt with a big bold white capital letter "D" centered on the chest.
Holding a folded heavy wool blanket (thick, colorful pattern, warm tones,
in good condition). He's positioning the blanket toward the camera as if
taking a photo of it with his smartphone. The "D" on the shirt is the ONLY
text visible.
```

**Output**: `ref-D-coperta.png` (o `.jpg`/`.jpeg`)

---

### S con tablet — interazione con B anziana (Ep. 3, scene 2, 6)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft lighting, soft
rounded shapes, no harsh lines, gentle and warm atmosphere, 2D art,
animated movie style, not realistic, warm modest Italian kitchen
background, wooden table.

Two people at a kitchen table. On one side: Italian woman, age 30, short
curly dark hair, wearing plain purple/violet cotton t-shirt with a big bold
white capital letter "S" centered on the chest, holding a tablet showing a
stylized green button interface, empathetic engaged friendly expression.
On the other side: Italian elderly woman, age 80, white hair in bun, modest
cardigan, leaning slightly toward the young woman with a hopeful
expression. The "S" on the shirt is the ONLY text visible.
```

**Output**: `ref-S-con-B-anziana.png` (o `.jpg`/`.jpeg`)

---

### O al bancone dell'ente (Ep. 1, scena 6; Ep. 2, scena 2; Ep. 3, scena 7)

#### Prompt Leonardo AI (versione PRONTA ALL'USO)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: realistic, photorealistic, photographic, 3d render, cgi, 3d model, hyperrealistic, real human face, photo, photography, dark, gritty, violent, text, watermark, signature, logo, blurry, low quality, deformed, extra limbs, extra fingers, mutated hands, bad anatomy

**Prompt positivo**:
```
flat 2D cartoon illustration, pixar style, studio ghibli style, hand-drawn
animation, cel shading, vector art style, clean lineart, bold simple shapes,
soft watercolor textures, pastel warm color palette, soft interior
lighting, soft rounded shapes, no harsh lines, gentle and warm
atmosphere, 2D art, animated movie style, not realistic, entrance hall of
an Italian community center, warm wooden details, welcoming professional
atmosphere, wooden counter.

Italian man, age 50, mature face, grey hair short cut, glasses, wearing
plain orange cotton t-shirt with a big bold white capital letter "O"
centered on the chest. Standing behind a wooden counter inside a community
building. He's holding a tablet showing a stylized QR code scanner
interface (just geometric shapes, no real text). Trustworthy calm
expression. The "O" on the shirt is the ONLY text visible.
```

**Output**: `ref-O-bancone.png` (o `.jpg`/`.jpeg`)

---

## Note operative

### Generazione con Midjourney
- Aggiungi `--ar 1:1` per reference quadrate (più versatili)
- Aggiungi `--v 6` per specificare la versione
- Aggiungi `--style raw` per ridurre "abbellimenti" non richiesti
- Esempio comando finale:
  ```
  /imagine prompt: [STYLE_PREFIX + descrizione D] --ar 1:1 --v 6 --style raw
  ```

### Generazione con Leonardo AI
- Modello consigliato: **Phoenix 1.0** (in modalità "Quality", non "Fast")
- Fallback: **GPT-Image-1** (per stile anime/Ghibli) o **Ideogram 4.0** (per architettura/testo)
- Negative prompt (FONDAMENTALE per evitare fotorealismo):
  ```
  realistic, photorealistic, photographic, 3d render, cgi, 3d model,
  hyperrealistic, real human face, photo, photography, dark, gritty,
  violent, text, watermark, signature, logo, blurry, low quality,
  deformed, extra limbs, extra fingers, mutated hands, bad anatomy
  ```
- Vedi sezione "Come ottenere lo stile CARTOON" in cima al file per dettagli completi.

### Generazione con DALL-E 3
- Modalità: via ChatGPT Plus
- Stile: "Cartoon / 2D illustration"
- Formato: 1024×1024 (quadrato) o 1792×1024 (16:9)

### Coerenza visiva tra personaggi
Per garantire che i 5 personaggi sembrino parte dello stesso universo:
1. **Genera il primo** (es. D) e scegli quello che ti piace di più
2. **Usa come riferimento** per gli altri: in Midjourney usa `--cref [URL immagine D]`
3. **Stesso seed** se possibile, o chiedi varianti dello stesso seed
4. **Stessa palette colori**: chiedi esplicitamente "same color palette as previous character"

### Output finale atteso
12-15 file immagine (PNG o JPG), ~1024×1024 ognuno, salvati in `assets/video-1/references/`:
- `ref-D-base.{png|jpg}`, `ref-D-bici.{png|jpg}`, `ref-D-notebook.{png|jpg}`, `ref-D-coperta.{png|jpg}`
- `ref-B-base.{png|jpg}`, `ref-B-bambina.{png|jpg}`, `ref-B-anziana.{png|jpg}`, `ref-B-bici.{png|jpg}`
- `ref-O-base.{png|jpg}`, `ref-O-bancone.{png|jpg}`
- `ref-S-base.{png|jpg}`, `ref-S-con-B-anziana.{png|jpg}`
- `ref-V-base.{png|jpg}`
- `ref-E-base.{png|jpg}`

**Formato accettato**: `.png` (preferito) oppure `.jpg`/`.jpeg` (se Leonardo AI scarica così). Entrambi vanno bene — su immagini cartoon la differenza è invisibile.

---

## ⚠️ DIAGNOSI 2026-09-15 — Reference da rigenerare

Dopo aver prodotto le prime 15 reference, l'audit visivo ha rilevato **6 immagini con stile incoerente** (realistico/3D-render invece di cartoon 2D Pixar-style). Causa probabile: i prompt delle varianti pose descrivevano sfondi realistici (cucina, ufficio, camera da letto) che hanno "sbloccato" il fotorealismo del modello, nonostante il prefix cartoon.

**Regola d'oro per le varianti pose**: il PREFIX cartoon deve essere **più aggressivo** e lo sfondo descritto in modo **astratto/stilizzato** (es. "simple stylized background", "flat minimal setting") — MAI una scena realistica tipo "Italian kitchen with wooden cabinets".

### Le 6 reference da rifare

| File | Problema rilevato | Soluzione |
|------|-------------------|-----------|
| `ref-B-anziana.jpg` | Realistico, rughe iper-dettagliate, look "nonna vera" | Aggiungere "stylized elderly face, simplified features, soft lines" + rinforzo anti-realismo |
| `ref-B-bici.jpg` | Semi-realistico "render cinematografico" | Rinforzo prefix cartoon + sfondo stilizzato (no "park with trees" descritti realisticamente) |
| `ref-D-notebook.jpg` | Semi-realistico + errore "RE" sullo schermo | Rinforzo prefix + descrivere schermo come "white laptop with NO text on screen" |
| `ref-D-coperta.jpg` | Realistico, iPhone con Apple logo riconoscibile | Rinforzo prefix + sostituire "smartphone" con "stylized simple phone" |
| `ref-O-bancone.jpg` | Semi-realistico, tablet è un iPad reale + errore "O°" vicino alla lettera | Rinforzo prefix + "stylized flat tablet" + specificare "ONLY the letter O on shirt, no other text anywhere" |
| `ref-S-con-B-anziana.jpg` | Cardigan della nonna VIOLA (= colore di S!) | Specificare "elderly woman wearing BEIGE/CREAM cardigan, NOT purple" |

### Guard-rail anti-realismo (da applicare a TUTTE le rigenerazioni)

```
NEGATIVE PROMPT RAFFORZATO (sempre uguale):
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

```
PREFIX RAFFORZATO (sempre in testa al prompt positivo):
flat 2D cartoon illustration, PIXAR STYLE 3D CHARACTER RENDER,
studios disney pixar animation style, hand-drawn cel shading,
clean lineart, bold simple shapes, soft watercolor textures,
pastel warm color palette, soft golden hour lighting,
clean composition, isolated on PURE WHITE BACKGROUND,
full body character portrait, looking at camera,
friendly approachable expression, soft rounded shapes,
no harsh lines, gentle and warm atmosphere,
2D art, animated movie style, NOT realistic, NOT photographic,
NOT a photograph, NOT a film still,
simplified features, smooth skin texture (no wrinkles detail),
illustrated not rendered
```

---

## Prompt RIGENERATI (versione corretta) — 6 reference

### ref-B-anziana.jpg — NONNA DI B (Ep. 3, scene 1, 2, 8, 9)

> ⚠️ In questa variante B è **anonima** (senza lettera/maglietta KYKOS) perché rappresenta una persona reale assistita dallo street operator.

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

### ref-B-bici.jpg — B SU BICI CON FIGLIA (Ep. 1, scena 9 finale)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

### ref-D-notebook.jpg — D CON LAPTOP (Ep. 2, scena 3)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

### ref-D-coperta.jpg — D CON COPERTA (Ep. 3, scena 5)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

### ref-O-bancone.jpg — O AL BANCONE DELL'ENTE (Ep. 1/2/3)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

### ref-S-con-B-anziana.jpg — S CON B ANZIANA (Ep. 3, scene 2, 6)

**Modello**: Phoenix 1.0 (Quality) — fallback: GPT-Image-1
**Negative prompt**: (il guard-rail sopra)

**Prompt positivo**:
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

---

## Checklist prima di accettare una generazione

Prima di salvare una reference, confrontala con `ref-D-base.jpg` (il benchmark di riferimento) e verifica TUTTI questi punti:

- [ ] Lo stile è coerente con `ref-D-base.jpg` (Pixar-style 3D, palette calda)
- [ ] La persona NON sembra una fotografia vera (no skin ultra-dettagliata)
- [ ] Lo sfondo è stilizzato/astratto o bianco (no scene realistiche dettagliate)
- [ ] L'unico testo visibile è la lettera sulla maglietta del personaggio
- [ ] I colori dei vestiti sono quelli giusti (no inversioni D↔B↔O↔S↔V)
- [ ] Nessun brand visibile (no Apple, no iPhone, no logo)
- [ ] Espressione del viso semplificata (non fotorealistica)
- [ ] La lettera sulla maglietta è leggibile e non deformata

Se anche solo UNO di questi punti fallisce → rigenera con il prompt aggiornato.

---

**Versione**: 1.1 — 15 settembre 2026
**Stato**: sezione "rigenerazione" aggiunta dopo audit visivo