-- =====================================================
-- KYKOS - Migration 009
-- Add legal_document_versions + admin_actions tables
-- + LegalDocumentStatus enum
-- Admin-driven versioning of legal documents (Privacy + ToS)
-- =====================================================
-- NB: migration 008 (LegalConsent, LegalDocumentType enum) deve essere
-- gia' stata applicata. Questa migration estende quel sistema aggiungendo
-- lo storico delle versioni PDF caricate dall'admin e l'audit log delle
-- sue azioni.
-- =====================================================

-- CreateEnum: LegalDocumentStatus
CREATE TYPE "LegalDocumentStatus" AS ENUM ('scheduled', 'active', 'archived');

-- CreateTable: legal_document_versions
-- Una riga per ogni PDF caricato dall'admin. Solo una riga per (type, version).
-- Una sola riga per type con status='active' (garantito dalla transazione in
-- POST /api/admin/legal/[id]/publish).
CREATE TABLE "legal_document_versions" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "LegalDocumentStatus" NOT NULL DEFAULT 'scheduled',
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_versions_type_version_key"
  ON "legal_document_versions"("type", "version");
CREATE INDEX "legal_document_versions_type_status_idx"
  ON "legal_document_versions"("type", "status");
CREATE INDEX "legal_document_versions_uploadedById_idx"
  ON "legal_document_versions"("uploadedById");

-- AddForeignKey
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: admin_actions
-- Audit log: chi ha fatto cosa quando sulle risorse admin.
-- In V1 usato per legal_doc.* (upload, publish, restore, delete).
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");
CREATE INDEX "admin_actions_action_idx" ON "admin_actions"("action");
CREATE INDEX "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
