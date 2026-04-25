import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateAndUploadQrCode, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';

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

    const donation = await prisma.donation.findUnique({
      where: { requestId },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            status: true,
            donorId: true,
            intermediary: { select: { name: true, hoursInfo: true } },
          },
        },
        donor: {
          select: {
            id: true,
            name: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Donazione non trovata' }, { status: 404 });
    }

    // Check if user is either donor or recipient
    const isDonor = session.id === donation.donorId;
    const isRecipient = session.id === donation.recipientId;

    if (!isDonor && !isRecipient) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Generate QR codes
    const deliverQrData = generateDeliverQrCode(requestId, donation.donorId);
    const pickupQrData = generatePickupQrCode(requestId, donation.recipientId);
    const deliverQrImage = await generateAndUploadQrCode(deliverQrData, `deliver-${requestId}.png`);
    const pickupQrImage = await generateAndUploadQrCode(pickupQrData, `pickup-${requestId}.png`);

    return NextResponse.json({
      donation: {
        id: donation.id,
        objectTitle: donation.object.title,
        status: donation.object.status,
      },
      qrCodes: {
        deliver: {
          type: 'deliver',
          data: deliverQrData,
          imageUrl: deliverQrImage,
          label: 'Consegna',
          description: 'Mostra questo QR code quando consegni l\'oggetto all\'ente',
        },
        pickup: {
          type: 'pickup',
          data: pickupQrData,
          imageUrl: pickupQrImage,
          label: 'Ritiro',
          description: 'Mostra questo QR code quando ritiri l\'oggetto dall\'ente',
        },
      },
      userType: isDonor ? 'donor' : 'recipient',
      entityName: donation.object.intermediary.name,
      entityHoursInfo: donation.object.intermediary.hoursInfo,
    });
  } catch (error) {
    console.error('QR code API error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
