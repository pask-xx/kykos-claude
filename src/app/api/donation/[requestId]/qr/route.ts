import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';
import { suggestLocationForTransaction } from '@/lib/location-suggest';

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
            intermediaryId: true, // Fase C: per suggestLocationForTransaction
            intermediary: { select: { name: true, hoursInfo: true } },
          },
        },
        donor: {
          select: {
            id: true,
            name: true,
            // Fase C: per distance scoring
            latitude: true,
            longitude: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            // Fase C: per distance scoring
            latitude: true,
            longitude: true,
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
    const deliverQrData = generateDeliverQrCode(requestId, donation.donorId, 'object');
    const pickupQrData = generatePickupQrCode(requestId, donation.recipientId, 'object');
    const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `deliver-${requestId}.png`);
    const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, `pickup-${requestId}.png`);

    // Fase C: calcola sede suggerita per QR page UI.
    // Best-effort: coordinate mancanti → fallback ragionevole.
    const locationSuggestion = await suggestLocationForTransaction({
      organizationId: donation.object.intermediaryId ?? '',
      donorLat: donation.donor.latitude ?? null,
      donorLng: donation.donor.longitude ?? null,
      beneficiaryLat: donation.recipient.latitude ?? null,
      beneficiaryLng: donation.recipient.longitude ?? null,
    });

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
      // Fase C: locationSuggestion per la UI QR
      locationSuggestion: {
        suggested: locationSuggestion.suggested,
        allLocations: locationSuggestion.allLocations,
      },
    });
  } catch (error) {
    console.error('QR code API error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
