import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      donorProfile: true,
      intermediaryOrg: true,
      referenceEntity: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Deriva `donorProfile.totalDonations` live per il DONATORE
  // autenticato. La colonna cached NON viene mai aggiornata
  // (vedi bug fix /api/operator/donors Fase 36.5, commit 0a55d9a) —
  // per simmetria contiamo le Donation reali qui. Per DONOR-ONLY:
  // includiamo TUTTE le donations cross-ente (il donatore le vede
  // tutte, indipendentemente dall'ente). NB: il valore cached
  // `totalObjects` è invece correttamente aggiornato in
  // /api/objects/route.ts:121.
  let liveTotalDonations: number | null = null;
  if (user.role === 'DONOR') {
    liveTotalDonations = await prisma.donation.count({
      where: { donorId: user.id },
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fiscalCode: user.fiscalCode,
      birthDate: user.birthDate,
      address: user.address,
      houseNumber: user.houseNumber,
      city: user.city,
      cap: user.cap,
      province: user.province,
      latitude: user.latitude,
      longitude: user.longitude,
      donorProfile: user.donorProfile
        ? {
            ...user.donorProfile,
            // Sovrascrivi cached totalDonations con il valore live
            // SOLO per DONOR. Per altri ruoli (RECIPIENT, ecc.) il
            // campo donorProfile potrebbe non esistere comunque.
            totalDonations:
              liveTotalDonations ?? user.donorProfile.totalDonations,
          }
        : user.donorProfile,
      intermediaryOrg: user.intermediaryOrg,
      referenceEntity: user.referenceEntity,
      authorized: user.authorized,
      isee: user.isee,
      profileImageUrl: user.profileImageUrl,
    },
  });
}, 'GET /api/auth/me');
