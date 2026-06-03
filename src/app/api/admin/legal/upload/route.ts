import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { withErrorHandler } from '@/lib/api';
import { validateFileMagicBytes, ALLOWED_DOCUMENT_MIMES } from '@/lib/file-validation';
import { createHash } from 'crypto';

const LEGAL_BUCKET = 'legal-documents';
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
const SEMVER_RE = /^\d+\.\d+(\.\d+)?$/;
const VALID_TYPES = ['TERMS', 'PRIVACY'] as const;
type LegalDocumentType = (typeof VALID_TYPES)[number];

/**
 * POST /api/admin/legal/upload
 *
 * Riceve multipart/form-data con:
 *   - file: PDF
 *   - type: 'TERMS' | 'PRIVACY'
 *   - version: stringa semver-like "1.0", "1.2", "2.0"
 *   - notes?: string (changelog opzionale)
 *
 * Validazione:
 * - Solo ADMIN.
 * - Magic bytes del PDF (anti-spoofing Content-Type).
 * - Dimensione max 10MB.
 * - Semver-like per version.
 *
 * Storage: `documents/{type}/v{version}.pdf` nel bucket `legal-documents`.
 * DB: crea (o sostituisce se esiste già in stato scheduled) un record
 *     LegalDocumentVersion con status='scheduled', hash SHA-256 calcolato
 *     server-side sul buffer ricevuto.
 *
 * NB: la transizione a status='active' NON avviene qui. È un'azione
 * esplicita su /api/admin/legal/[id]/publish, per dare all'admin il
 * tempo di verificare il PDF prima di forzare il re-consenso.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const type = formData.get('type') as string | null;
  const version = formData.get('version') as string | null;
  const notes = formData.get('notes') as string | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type as LegalDocumentType)) {
    return NextResponse.json(
      { error: 'type non valido (atteso: TERMS o PRIVACY)' },
      { status: 400 }
    );
  }
  if (!version || !SEMVER_RE.test(version)) {
    return NextResponse.json(
      { error: 'version non valida (formato atteso: 1.0, 1.2.3)' },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File vuoto' }, { status: 400 });
  }
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: `File troppo grande (max ${MAX_PDF_SIZE / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  // Convert to Buffer once (needed for both magic bytes check AND hash)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // A7: validate magic bytes (NOT the client-declared file.type)
  const validation = await validateFileMagicBytes(
    buffer,
    ALLOWED_DOCUMENT_MIMES as readonly string[]
  );
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.reason },
      { status: 400 }
    );
  }
  if (validation.detectedMime !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Solo PDF accettato per documenti legali' },
      { status: 400 }
    );
  }

  // SHA-256 calcolato server-side (prova legale dell'esatto contenuto)
  const hash = createHash('sha256').update(buffer).digest('hex');

  const storagePath = `documents/${type.toLowerCase()}/v${version}.pdf`;

  // Upload to Supabase Storage. contentType = detected MIME, mai il client type.
  const { error: uploadError } = await supabaseAdmin.storage
    .from(LEGAL_BUCKET)
    .upload(storagePath, buffer, {
      contentType: validation.detectedMime,
      cacheControl: 'public, max-age=300',
      upsert: true, // se l'admin ri-uploada la stessa version, sovrascrive
    });

  if (uploadError) {
    console.error('[legal upload] Supabase storage error:', uploadError);
    return NextResponse.json(
      { error: 'Errore durante l\'upload del file' },
      { status: 500 }
    );
  }

  // Se esiste già una LegalDocumentVersion (type, version), aggiorna.
  // Altrimenti creane una nuova in stato scheduled.
  // L'unique (type, version) impedisce race condition.
  const legalDoc = await prisma.legalDocumentVersion.upsert({
    where: {
      type_version: {
        type: type as LegalDocumentType,
        version,
      },
    },
    create: {
      type: type as LegalDocumentType,
      version,
      hash,
      storagePath,
      fileSize: file.size,
      status: 'scheduled',
      uploadedById: session.id,
      notes: notes?.trim() || null,
    },
    update: {
      hash,
      storagePath,
      fileSize: file.size,
      // NB: NON tocco status qui. Se era scheduled, resta scheduled (admin
      // può ri-uploada re-fixando typo). Se era active/archived, il file
      // viene comunque sovrascritto in storage ma il record mantiene lo
      // status corrente. Forzare uno status diverso richiede azione
      // esplicita (publish o archive).
      notes: notes?.trim() || null,
    },
  });

  // Audit log
  await prisma.adminAction.create({
    data: {
      adminId: session.id,
      action: 'legal_doc.upload',
      targetType: 'LegalDocumentVersion',
      targetId: legalDoc.id,
    },
  });

  return NextResponse.json({
    id: legalDoc.id,
    type: legalDoc.type,
    version: legalDoc.version,
    status: legalDoc.status,
    hash: legalDoc.hash,
    fileSize: legalDoc.fileSize,
    storagePath: legalDoc.storagePath,
  });
}, 'POST /api/admin/legal/upload');
