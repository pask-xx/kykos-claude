-- AlterEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY');

-- CreateTable: LegalConsent
-- GDPR art. 7: tracciamento del consenso a privacy + termini di servizio.
-- Una entry per (utente, documento, versione) — l'unicità permette di dimostrare
-- in caso di audit Garante cosa l'utente ha accettato, quando, e l'esatto hash
-- del documento accettato.
CREATE TABLE "legal_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "legal_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_consents_userId_documentType_version_key" ON "legal_consents"("userId", "documentType", "version");
CREATE INDEX "legal_consents_userId_idx" ON "legal_consents"("userId");
CREATE INDEX "legal_consents_documentType_version_idx" ON "legal_consents"("documentType", "version");

-- AddForeignKey
ALTER TABLE "legal_consents" ADD CONSTRAINT "legal_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
