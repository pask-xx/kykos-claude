/**
 * Seed iniziale: crea v1.0 di TERMS e PRIVACY come "attive" + upload PDF
 * segnaposto su Supabase Storage.
 *
 * USO: eseguire UNA TANTUM dopo aver:
 *   1. Applicato la migration `prisma/migrations/009_add_legal_documents/`
 *   2. Creato il bucket "legal-documents" su Supabase Dashboard (pubblico)
 *   3. Applicato `scripts/fix-storage-policies-legal.sql`
 *   4. Creato almeno un utente ADMIN (vedi /admin/setup)
 *   5. Settato ADMIN_USER_ID in .env o passato come argomento
 *
 *   npx tsx scripts/seed-legal-v1.ts
 *
 *   oppure con admin user esplicito:
 *   npx tsx scripts/seed-legal-v1.ts --admin-email=admin@kykos.it
 *
 * Lo script è IDEMPOTENTE: se la v1.0 esiste già (su DB o su Storage),
 * salta. Usa UPSERT ovunque.
 *
 * IMPORTANTE: i PDF segnaposto sono versioni "stub" (1 pagina "Versione
 * iniziale, da sostituire con documento del legale"). NON sono giuridicamente
 * validi — servono solo per sbloccare il flusso tecnico end-to-end. Dopo
 * il primo deploy, l'admin deve caricare i PDF veri via /admin/legal.
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Carica .env dallo root del progetto (3 livelli sopra scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere settate in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Crea un PDF segnaposto valido (1 pagina con titolo). È solo per sbloccare
 * il flusso: dopo, l'admin caricherà il PDF vero via /admin/legal.
 *
 * La struttura minima valida di un PDF 1.4 è:
 *   %PDF-1.4
 *   1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
 *   2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
 *   3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
 *   4 0 obj << /Length 88 >> stream
 *   BT /F1 24 Tf 100 700 Td (KYKOS - PLACEHOLDER v1.0) Tj ET
 *   endstream endobj
 *   5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
 *   xref
 *   0 6
 *   0000000000 65535 f
 *   0000000009 00000 n
 *   ...
 *   trailer << /Size 6 /Root 1 0 R >>
 *   startxref
 *   ...
 *   %%EOF
 */
function buildPlaceholderPdf(title: string): Buffer {
  const objects: string[] = [];

  // Object 1: catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: page
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  );

  // Object 4: contents (stream)
  const content = `BT /F1 24 Tf 100 700 Td (${title}) Tj ET\nBT /F1 14 Tf 100 670 Td (Versione segnaposto - da sostituire con documento del legale) Tj ET\n`;
  objects.push(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  // Object 5: font
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // Compute offsets
  const header = '%PDF-1.4\n';
  let body = header;
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }

  // xref
  const xrefOffset = body.length;
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map(o => o.toString().padStart(10, '0') + ' 00000 n \n')
    .join('')}`;

  // trailer
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'binary');
}

const LEGAL_BUCKET = 'legal-documents';

async function uploadPlaceholder(type: 'TERMS' | 'PRIVACY', version: string): Promise<{ hash: string; size: number; path: string }> {
  const title = `KYKOS - ${type} v${version} (SEGNAPOSTO)`;
  const buffer = buildPlaceholderPdf(title);
  const hash = createHash('sha256').update(buffer).digest('hex');
  const path = `documents/kykos-${type.toLowerCase()}-v${version}.pdf`;

  console.log(`  → Uploading ${path} (${buffer.length} bytes, sha256=${hash.slice(0, 16)}...)`);

  const { error } = await supabase.storage.from(LEGAL_BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    cacheControl: 'public, max-age=300',
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload fallito per ${path}: ${error.message}`);
  }

  return { hash, size: buffer.length, path };
}

async function getAdminUserId(): Promise<string> {
  // Try --admin-email arg
  const argEmail = process.argv.find(a => a.startsWith('--admin-email='))?.split('=')[1];

  if (argEmail) {
    const u = await prisma.user.findUnique({ where: { email: argEmail }, select: { id: true } });
    if (!u) throw new Error(`Utente con email ${argEmail} non trovato`);
    if (await isAdmin(u.id) === false) {
      throw new Error(`Utente ${argEmail} non è ADMIN`);
    }
    return u.id;
  }

  // Else: first ADMIN user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new Error(
      'Nessun utente ADMIN trovato in DB. Crea prima un admin con POST /api/admin/setup, ' +
      'oppure passa --admin-email=...'
    );
  }

  console.log(`  → Trovato admin user: ${admin.email} (id=${admin.id})`);
  return admin.id;
}

async function isAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === 'ADMIN';
}

async function seedVersion(type: 'TERMS' | 'PRIVACY', version: string, adminId: string): Promise<void> {
  // Check if already exists
  const existing = await prisma.legalDocumentVersion.findUnique({
    where: { type_version: { type, version } },
  });

  if (existing) {
    console.log(`  ⊙ v${version} di ${type} già presente in DB (status=${existing.status}) — skip`);
    return;
  }

  // Upload PDF segnaposto
  const { hash, size, path } = await uploadPlaceholder(type, version);

  // Create record
  const now = new Date();
  await prisma.legalDocumentVersion.create({
    data: {
      type,
      version,
      hash,
      storagePath: path,
      fileSize: size,
      status: 'active',
      uploadedById: adminId,
      uploadedAt: now,
      publishedAt: now,
      notes: 'Versione iniziale (segnaposto). Sostituire con il documento del legale via /admin/legal.',
    },
  });

  console.log(`  ✅ v${version} di ${type} creata come ATTIVA`);
}

async function main() {
  console.log('=== Seed v1.0 documenti legali ===\n');

  console.log('1/3 Verifica bucket "legal-documents"...');
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(LEGAL_BUCKET);
  if (bucketErr || !bucket) {
    console.error(`❌ Bucket "${LEGAL_BUCKET}" non trovato. Crealo su Supabase Dashboard (pubblico).`);
    process.exit(1);
  }
  console.log(`  ✅ Bucket OK (public=${bucket.public})\n`);

  console.log('2/3 Recupero admin user...');
  const adminId = await getAdminUserId();
  console.log();

  console.log('3/3 Seed v1.0 TERMS + PRIVACY...');
  await seedVersion('TERMS', '1.0', adminId);
  await seedVersion('PRIVACY', '1.0', adminId);

  // Audit log
  await prisma.adminAction.create({
    data: {
      adminId,
      action: 'legal_doc.seed_v1',
      metadata: { note: 'Seed iniziale v1.0 TERMS+PRIVACY (segnaposto)' },
    },
  });

  console.log('\n=== Seed completato ===');
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   I PDF caricati sono SEGNAPOSTI tecnicamente validi ma NON hanno');
  console.log('   contenuto giuridico. Dopo questo seed, l\'admin deve caricare i');
  console.log('   documenti veri del legale via /admin/legal come v1.1.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('❌ Seed fallito:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
