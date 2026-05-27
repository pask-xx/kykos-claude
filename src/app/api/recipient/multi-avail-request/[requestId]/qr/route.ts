import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { generateMultiAvailabilityQrCode } from '@/lib/qrcode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { requestId } = await params;

    const multiAvailRequest = await prisma.multiAvailabilityRequest.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        multiAvailability: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            status: true,
          },
        },
      },
    });

    if (!multiAvailRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Check if user is the beneficiary
    const isBeneficiary = session.id === multiAvailRequest.beneficiaryId;

    if (!isBeneficiary) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: multiAvailRequest.multiAvailability.organizationId },
      select: {
        name: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        hoursInfo: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Ente non trovato' }, { status: 404 });
    }

    // Generate QR code if not exists
    let qrCodeData = multiAvailRequest.qrCode;
    if (!qrCodeData) {
      qrCodeData = generateMultiAvailabilityQrCode(multiAvailRequest.id, multiAvailRequest.beneficiaryId);
      await prisma.multiAvailabilityRequest.update({
        where: { id: requestId },
        data: { qrCode: qrCodeData },
      });
    }

    const qrCodeImage = await generateAndUploadQrCodeWithLogo(
      qrCodeData,
      `multi-avail-pickup-${requestId}.png`
    );

    return NextResponse.json({
      multiAvailRequest: {
        id: multiAvailRequest.id,
        title: multiAvailRequest.multiAvailability.title,
        status: multiAvailRequest.status,
      },
      qrCode: {
        type: 'pickup',
        data: qrCodeData,
        imageUrl: qrCodeImage,
        label: 'Ritiro',
        description: "Mostra questo QR code quando ritiri la disponibilità dall'ente",
      },
      entityName: organization.name,
      entityHoursInfo: organization.hoursInfo,
      entityAddress: organization.address,
      entityHouseNumber: organization.houseNumber,
      entityCap: organization.cap,
      entityCity: organization.city,
      entityProvince: organization.province,
      entityPhone: organization.phone,
      entityEmail: organization.email,
    });
  } catch (error) {
    console.error('MultiAvail QR code API error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
