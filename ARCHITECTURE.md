
# KYKOS - Architecture & Data Model

## 1. Tech Stack
```
Frontend + Backend: Next.js 14 (App Router)
Database: PostgreSQL (Supabase)
ORM: Prisma
Auth: Custom JWT with cookies
Storage: Supabase Storage (for photos)
Styling: Tailwind CSS
Deploy: Vercel + Supabase
```

---

## 2. User Roles

| Role | Description |
|------|-------------|
| `DONOR` | Registered user who donates objects |
| `RECIPIENT` | Economically disadvantaged person, authorized by intermediary |
| `INTERMEDIARY` | Charity center, church, association - manages authorizations |
| `ADMIN` | Platform administrator |

### 2.1 Recipient Authorization Flow
- Recipient registers with `referenceEntityId` (intermediary organization) and `ISEE` value
- `authorized: false` by default
- Intermediary must approve from their dashboard
- Only authorized recipients can request objects

### 2.2 Donor-Entity Association
- Donors select which intermediary(ies) can receive their objects
- Objects are published to selected intermediary

---

## 3. Data Model (Prisma Schema)

### 3.1 User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          Role      @default(DONOR)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Recipient fields
  referenceEntityId String?
  referenceEntity   Organization? @relation("RecipientReference", fields: [referenceEntityId], references: [id])
  isee              Decimal?
  authorized        Boolean   @default(false)
  authorizedAt      DateTime?

  // Relations
  donatedObjects Object[]     @relation("DonorObjects")
  donorProfile   DonorProfile?
  requests        Request[] @relation("RecipientRequests")
  receivedDonations Donation[] @relation("ReceivedDonations")
  intermediaryOrg   Organization?
  donations        Donation[] @relation("DonationDonor")
}
```

### 3.2 Organization (Intermediary)
```prisma
model Organization {
  id            String    @id @default(cuid())
  name          String
  type          OrgType  // CHARITY, CHURCH, ASSOCIATION
  address       String?
  phone         String?
  email         String?
  verified      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  objects       Object[]
  requests      Request[]
  payments      Payment[]
  authorizedRecipients User[] @relation("RecipientReference")
}
```

### 3.3 Object (Donation Item)
```prisma
model Object {
  id            String       @id @default(cuid())
  title         String
  description   String?
  category      Category
  condition     Condition
  status        ObjectStatus @default(AVAILABLE)
  imageUrl      String?      // Supabase Storage URL
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  donorId       String
  donor         User         @relation("DonorObjects", fields: [donorId], references: [id], onDelete: Cascade)

  intermediaryId String
  intermediary   Organization @relation(fields: [intermediaryId], references: [id])

  requests      Request[]
  donation      Donation?
}
```

### 3.4 Request
```prisma
model Request {
  id            String        @id @default(cuid())
  status        RequestStatus @default(PENDING)
  message       String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  objectId      String
  object        Object        @relation(fields: [objectId], references: [id], onDelete: Cascade)

  recipientId   String
  recipient     User          @relation("RecipientRequests", fields: [recipientId], references: [id], onDelete: Cascade)

  intermediaryId String
  intermediary   Organization @relation(fields: [intermediaryId], references: [id])

  donation      Donation?
}
```

### 3.5 Donation
```prisma
model Donation {
  id            String   @id @default(cuid())
  amount        Decimal  @default(1.00)
  currency      String   @default("EUR")
  createdAt     DateTime @default(now())

  objectId      String   @unique
  object        Object   @relation(fields: [objectId], references: [id], onDelete: Cascade)

  donorId       String
  donor         User     @relation("DonationDonor", fields: [donorId], references: [id], onDelete: Cascade)

  recipientId   String
  recipient     User     @relation("ReceivedDonations", fields: [recipientId], references: [id], onDelete: Cascade)

  requestId     String   @unique
  request       Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)

  paymentId     String?  @unique
  payment       Payment?  @relation(fields: [paymentId], references: [id])
}
```

### 3.6 DonorProfile
```prisma
model DonorProfile {
  id             String     @id @default(cuid())
  totalDonations Int        @default(0)
  totalObjects   Int        @default(0)
  level          DonorLevel @default(BRONZE)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  userId         String     @unique
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 4. Enums

```prisma
enum Role { DONOR, RECIPIENT, INTERMEDIARY, ADMIN }
enum OrgType { CHARITY, CHURCH, ASSOCIATION }
enum Category { FURNITURE, ELECTRONICS, CLOTHING, BOOKS, KITCHEN, SPORTS, TOYS, OTHER }
enum Condition { NEW, LIKE_NEW, GOOD, FAIR, POOR }
enum ObjectStatus { AVAILABLE, RESERVED, DONATED, WITHDRAWN }
enum RequestStatus { PENDING, APPROVED, REJECTED, EXPIRED }
enum DonorLevel { BRONZE, SILVER, GOLD, PLATINUM, DIAMOND }
```

---

## 5. API Endpoints

### Auth
- `POST /api/auth/register` - Register (role-specific fields)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Objects
- `GET /api/objects` - List available objects
- `POST /api/objects` - Create object (donor only)
- `GET /api/objects/[id]` - Get object details

### Requests
- `GET /api/requests` - List requests (recipient)
- `POST /api/requests` - Create request (recipient)

### Intermediaries
- `GET /api/intermediaries` - List verified intermediaries

### Intermediary (protected)
- `GET /api/intermediary/requests` - All requests for org
- `PATCH /api/intermediary/requests` - Approve/reject request

### Upload
- `POST /api/upload` - Upload photo to Supabase Storage

### Donor
- `GET /api/donor/objects` - Donor's objects

### Recipient
- `GET /api/recipient/requests` - Recipient's requests

---

## 6. Anonymity Model

### 6.1 Rules
- Donor NEVER sees recipient identity
- Recipient NEVER sees donor identity
- Only Intermediary knows both sides
- Object transfer happens via intermediary

### 6.2 Data Isolation
- Donor's view: their donated objects + anonymous stats
- Recipient's view: their requests + received items (no donor info)
- Intermediary's view: full visibility for management

---

## 7. Page Structure

```
/                           - Landing page
/auth/login                 - Login
/auth/register               - Register (role selection)

/donor/
  /dashboard                - Donor dashboard
  /objects                  - My objects list
  /objects/new              - Add new object (with photo upload)

/recipient/
  /dashboard                - Recipient dashboard
  /browse                   - Browse available objects
  /requests                 - My requests status

/intermediary/
  /dashboard                - Intermediary dashboard
  /requests                 - Manage requests (approve/reject)

/admin/ (future)
  /dashboard                - Admin dashboard
  /intermediaries          - Manage intermediary applications
```

---

## 8. Key Flows

### 8.1 Registration Flow
**Donor:** Basic registration
**Recipient:**
1. Select reference intermediary
2. Enter ISEE value
3. Submit → `authorized: false` until approved
**Intermediary:**
1. Register with organization details
2. `verified: false` until admin approval

### 8.2 Donation Flow
1. Donor posts object with photo → selects intermediary
2. Object appears in browse (for authorized recipients of that intermediary)
3. Recipient requests object
4. Intermediary approves/rejects
5. If approved → symbolic payment (1-2€) → donation completes
6. Donor level updates

### 8.3 Photo Upload Flow
1. User selects/captures photo
2. Frontend sends to `/api/upload` as FormData
3. API uploads to Supabase Storage (bucket: `objects`)
4. Returns public URL
5. URL stored with object

---

## 9. Test Accounts (Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kykos.it | admin123 |
| Intermediary | caritas.roma@kykos.it | ente123 |
| Intermediary | parrocchia.sangiovanni@kykos.it | ente123 |
| Intermediary | associazione.arcobaleno@kykos.it | ente123 |
| Donor | donatore@test.it | donatore123 |
| Recipient | ricevente@test.it | ricevente123 |

---

## 10. Future Features (Not Implemented)

- [ ] Geolocation for finding nearby intermediaries
- [ ] Max 3 nearby intermediaries for recipients
- [ ] Donor entity selection (which intermediaries can receive)
- [ ] ISEE document upload and validation
- [ ] Payment integration (Stripe/Supabase)
- [ ] Email notifications
- [ ] Donor gamification (levels)
- [ ] Admin panel for intermediary approval
- [ ] Mobile app (Capacitor/React Native)

---

## 11. Environment Variables

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=kykos-secret-key...
SUPABASE_SERVICE_KEY=eyJ... (service_role)
```

---

## 12. Database Status

- [x] Users with role-based fields
- [x] Organizations (intermediaries)
- [x] Objects with photo URLs
- [x] Requests workflow
- [x] Donations
- [x] Donor profiles
- [x] Recipient authorization (authorized field)
- [x] Reference entity relationship
- [x] Index on Object.status (for browse performance)
- [ ] Geolocation fields (lat/lng for future)
- [ ] Family size for ISEE calculations (future)

## 13. Performance Optimizations

- [x] Vercel region: fra1 (EU, closest to Supabase eu-west-1)
- [x] Index on Object.status for browse queries
- [x] Index on foreign keys (existing)
- [x] Promise.all for parallel data fetching
- [x] Explicit select for needed fields only
- [x] Single-pass distance calculation in browse
