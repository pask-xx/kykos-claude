# KYKOS Video 1 — Asset Pipeline

> Pipeline di produzione per il video divulgativo "Donare è semplice. È anonimo. È KYKOS." (3 episodi, ~90s).
> Sceneggiatura completa: [`docs/VIDEO-1-SCENEGGIATURA.md`](../../docs/VIDEO-1-SCENEGGIATURA.md).

## Struttura cartelle

```
assets/video-1/
├── references/     # Reference visive dei personaggi (PNG/JPG) - FASE 1
├── scenes/         # Scene video generate da AI (MP4, 3s ciascuna) - FASE 2
│   └── raw/        # Output grezzo dai tool AI prima del montaggio
├── voiceover/      # File audio del narratore italiano (MP3/WAV) - FASE 3
├── music/          # Musica sottofondo con licenza commerciale - FASE 4
└── final/          # Video finali montati, pronti per pubblicazione - FASE 5
```

## Convenzione nomi file

### Reference personaggi
```
ref-{personaggio}-{variante}.{png|jpg|jpeg}

Esempi:
- ref-D-base.png          # D base, posa neutra
- ref-D-bici.jpg          # D che tiene una bicicletta
- ref-B-base.jpg          # B base, posa neutra
- ref-B-bambina.png       # B con figlia 5 anni
- ref-B-anziana.jpg       # B anziana (per Episodio 3)
- ref-O-base.png          # O base con tablet
- ref-S-base.jpg          # S base con tablet
- ref-V-base.png          # V base
- ref-E-base.jpg          # Edificio ente
```

**Nota formato**: `.png` (preferito, lossless) o `.jpg`/`.jpeg` (accettato, Leonardo AI default).
Entrambi i formati vanno bene per le reference — la differenza è invisibile su immagini cartoon.

### Scene video
```
scena-{numero}-{episodio}-{soggetto-breve}.mp4

Esempi:
- scena-00-intro-D.mp4        # Scena 0, presentazione D
- scena-00-intro-B.mp4        # Scena 0, presentazione B
- scena-01-ep1-casa-D.mp4     # Scena 1, Episodio 1, D in casa
- scena-04-ep3-pubblicata.mp4 # Scena 4, Episodio 3, richiesta pubblicata
- scena-08-ep3-consegna.mp4   # Scena 8, Episodio 3, S porta a casa di B
```

### Voice-over
```
vo-{numero-scena}-{parola-chiave}.mp3

Esempi:
- vo-00-intro-D.mp3   # "Io sono il Donatore"
- vo-01-ep1-casa.mp3  # "A volte abbiamo cose che non usiamo più..."
```

### Video finali
```
kykos-video-1-{formato}.mp4

Esempi:
- kykos-video-1-169.mp4  # 16:9 per sito/presentazione
- kykos-video-1-916.mp4  # 9:16 per Instagram/TikTok
- kykos-video-1-11.mp4   # 1:1 per LinkedIn/Facebook
```

## Stato pipeline

- [x] **Fase 0** — Struttura cartelle creata
- [ ] **Fase 1** — Reference personaggi (in corso)
- [ ] **Fase 2** — Scene video AI
- [ ] **Fase 3** — Voice-over italiano
- [ ] **Fase 4** — Musica sottofondo
- [ ] **Fase 5** — Editing e montaggio
- [ ] **Fase 6** — Pubblicazione sito
- [ ] **Fase 7** — Distribuzione social

Vedi [`docs/VIDEO-1-SCENEGGIATURA.md`](../../docs/VIDEO-1-SCENEGGIATURA.md) sezione "Tool consigliati per la produzione" per la lista tool di ogni fase.

## Note

- I file audio/video/binari sono **esclusi da git** via `.gitignore` (vedi root)
- I file di testo (prompt, sceneggiatura, script) **sono versionati**
- Le reference visive servono a mantenere la **coerenza visiva** tra le scene generate da AI diversi run