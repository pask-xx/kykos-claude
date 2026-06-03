import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

export const POST = withErrorHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  if (session.role !== 'INTERMEDIARY') {
    return NextResponse.json({ error: 'Solo gli intermediari possono aggiornare i dati dell\'organizzazione' }, { status: 403 });
  }

  const {
    address,
    houseNumber,
    cap,
    city,
    province,
    vatNumber,
    phone,
    email,
    latitude,
    longitude,
    autoApproveRequests,
    hoursInfo,
    dioceseId,
  } = await request.json();

  // Get organization by userId
  const org = await prisma.organization.findUnique({
    where: { userId: session.id },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
  }

  // Update organization
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      address: address || null,
      houseNumber: houseNumber || null,
      cap: cap || null,
      city: city || null,
      province: province || null,
      vatNumber: vatNumber || null,
      phone: phone || null,
      email: email || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      autoApproveRequests: Boolean(autoApproveRequests),
      hoursInfo: hoursInfo || null,
      dioceseId: dioceseId || null,
    },
  });

  return NextResponse.json({ success: true, organization: updated });
}, 'POST /api/organization/update');
