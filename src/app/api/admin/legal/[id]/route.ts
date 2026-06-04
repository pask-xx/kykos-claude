import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { withErrorHandler } from '@/lib/api';

interface DeleteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/legal/[id]
 *
 * Cancella una versione di documento legale.
 *
 * Regole di cancellazione (per preservare la prova legale storica,
 * Provv. Garante 229/2014):
 * - scheduled: ✅ cancellabile (è una "bozza", mai vista dagli utenti)
 * - active:    ❌ NON cancellabile (è la versione corrente, serve per audit)
 * - archived:  ❌ NON cancellabile (è nello storico, serve per audit Garante)
 *
 * Operazione:
 * 1. Verifica status === 'scheduled'
 * 2. Rimuove il file PDF dal bucket Supabase Storage
 * 3. Cancella il record dal DB
 * 4. Logga in AdminAction
 *
 * NB: se la cancellazione del file da Storage fallisce (network error,
 * file non più lì), proseguiamo comunque con la cancellazione del
 * record DB. L'utente può ri-uploadare con la stessa (type, version)
 * grazie all'upsert. Logghiamo il warning ma non blocchiamo.
 */
export const DELETE = withErrorHandler(async (_request: Request, ctx: DeleteParams) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
  }

  const { id } = await ctx.params;

  const target = await prisma.legalDocumentVersion.findUnique({
    where: { id },
    select: { id: true, type: true, version: true, status: true, storagePath: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'Versione non trovata' }, { status: 404 });
  }

  // Hard guard: solo le scheduled sono cancellabili. active/archived sono
  // prove legali e vanno preservate per audit Garante.
  if (target.status !== 'scheduled') {
    return NextResponse.json(
      {
        error:
          'Solo le versioni in stato "scheduled" (programmate ma non ancora pubblicate) possono essere eliminate. ' +
          'Le versioni "active" o "archived" vanno preservate per la prova legale.',
      },
      { status: 403 }
    );
  }

  // Step 1: rimuovi il file da Storage. Se fallisce, logga ma non bloccare.
  const { error: storageError } = await supabaseAdmin.storage
    .from('legal-documents')
    .remove([target.storagePath]);

  if (storageError) {
    // Non blocchiamo: l'utente può ri-uploadare con la stessa (type, version)
    // e l'upsert in /upload sovrascriverà il file. Logghiamo per audit.
    console.warn(
      `[legal delete] Failed to remove file ${target.storagePath} from Storage:`,
      storageError
    );
  }

  // Step 2: cancella il record
  await prisma.legalDocumentVersion.delete({
    where: { id: target.id },
  });

  // Step 3: audit log
  await prisma.adminAction.create({
    data: {
      adminId: session.id,
      action: 'legal_doc.delete',
      targetType: 'LegalDocumentVersion',
      targetId: target.id,
      metadata: {
        type: target.type,
        version: target.version,
        storageFileRemoved: !storageError,
      },
    },
  });

  return NextResponse.json({
    success: true,
    deleted: {
      id: target.id,
      type: target.type,
      version: target.version,
      storageFileRemoved: !storageError,
    },
  });
}, 'DELETE /api/admin/legal/[id]');
