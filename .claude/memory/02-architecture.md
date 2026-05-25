---
name: 02-architecture
description: Stack tecnologico e struttura del codebase KYKOS
metadata:
  type: reference
---

# Architettura KYKOS

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5.10.0 |
| Auth | JWT cookies custom + Supabase Auth |
| Storage | Supabase Storage (foto) |
| Deployment | Vercel |
| Styling | Tailwind CSS |

## Struttura Directory

```
src/app/
├── auth/              # Login, register, conferma email
├── admin/             # Admin piattaforma (gestione intermediari)
├── donor/             # Portale donatore
│   ├── dashboard/
│   ├── objects/       # Gestione oggetti donati
│   ├── requests/      # Vedi richieste per i tuoi oggetti (anonime)
│   ├── to-deliver/    # Oggetti in attesa di consegna
│   └── qr*/           # QR code per consegna
├── recipient/         # Portale ricevente
│   ├── dashboard/
│   ├── objects/       # Sfoglia disponibili (ANONIMO - no donor.name)
│   ├── requests/      # Le tue richieste
│   └── my-objects/    # Oggetti ricevuti
├── intermediary/      # Portale organizzazione
│   ├── dashboard/
│   ├── requests/      # Gestisci TUTTE le richieste (vede entrambi)
│   ├── recipients/     # Gestisci riceventi autorizzati
│   └── operators/     # Gestisci staff
├── operator/          # Login staff (JWT separato: operator_session)
│   ├── scan-qr/       # Scan QR per pickup/consegna
│   └── ...
├── objects/           # Page pubblica (REQUIRES AUTH - altrimenti non visibile)
├── api/               # 90+ route API
└── manifesto/

src/lib/
├── auth.ts            # Gestione JWT, sessioni
├── prisma.ts          # Singleton Prisma client
└── ...

src/components/        # Componenti UI condivisi
src/types/index.ts     # TypeScript types e enum
```

## Enum Principali

- **Role**: DONOR, RECIPIENT, INTERMEDIARY, ADMIN
- **ObjectStatus**: AVAILABLE, REQUESTED, DELIVERING, DELIVERED, CANCELLED
- **RequestStatus**: PENDING, APPROVED, REJECTED, DELIVERED, CANCELLED
- **DonorLevel**: BRONZE, SILVER, GOLD, PLATINUM, DIAMOND (gamification)
