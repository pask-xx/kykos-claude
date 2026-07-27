import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';
import { suggestLocationForTransaction } from '@/lib/location-suggest';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: requestId } = await params;

    const goodsRequest = await prisma.goodsRequest.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: {
          select: {
            id: true,
            name: true,
            email: true,
            // Fase C: per distance scoring
            latitude: true,
            longitude: true,
          },
        },
        fulfilledBy: {
          select: {
            id: true,
            name: true,
            email: true,
            // Fase C: per distance scoring
            latitude: true,
            longitude: true,
          },
        },
        intermediary: {
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
            hours: true,
            notes: true,
          },
        },
      },
    });

    if (!goodsRequest) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    // Check if user is either fulfiller (donor) or beneficiary
    const isFulfiller = session.id === goodsRequest.fulfilledById;
    const isBeneficiary = session.id === goodsRequest.beneficiaryId;

    if (!isFulfiller && !isBeneficiary) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Generate QR codes
    const deliverQrData = generateDeliverQrCode(requestId, goodsRequest.fulfilledById!, 'goods');
    const pickupQrData = generatePickupQrCode(requestId, goodsRequest.beneficiaryId, 'goods');
    const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `goods-deliver-${requestId}.png`);
    const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, `goods-pickup-${requestId}.png`);

    // Fase C: calcola sede suggerita per QR page UI.
    // Best-effort: coordinate mancanti → fallback ragionevole.
    const locationSuggestion = await suggestLocationForTransaction({
      organizationId: goodsRequest.intermediaryId,
      donorLat: goodsRequest.fulfilledBy?.latitude ?? null,
      donorLng: goodsRequest.fulfilledBy?.longitude ?? null,
      beneficiaryLat: goodsRequest.beneficiary?.latitude ?? null,
      beneficiaryLng: goodsRequest.beneficiary?.longitude ?? null,
    });

    return NextResponse.json({
      goodsRequest: {
        id: goodsRequest.id,
        title: goodsRequest.title,
        status: goodsRequest.status,
      },
      qrCodes: {
        deliver: {
          type: 'deliver',
          data: deliverQrData,
          imageUrl: deliverQrImage,
          label: 'Consegna',
          description: "Mostra questo QR code quando consegni l'oggetto all'ente",
        },
        pickup: {
          type: 'pickup',
          data: pickupQrData,
          imageUrl: pickupQrImage,
          label: 'Ritiro',
          description: "Mostra questo QR code quando ritiri l'oggetto dall'ente",
        },
      },
      userType: isFulfiller ? 'fulfiller' : 'beneficiary',
      entityName: goodsRequest.intermediary.name,
      entityHoursInfo: goodsRequest.intermediary.hoursInfo,
      entityHours: goodsRequest.intermediary.hours,
      entityNotes: goodsRequest.intermediary.notes,
      entityAddress: goodsRequest.intermediary.address,
      entityHouseNumber: goodsRequest.intermediary.houseNumber,
      entityCap: goodsRequest.intermediary.cap,
      entityCity: goodsRequest.intermediary.city,
      entityProvince: goodsRequest.intermediary.province,
      entityPhone: goodsRequest.intermediary.phone,
      entityEmail: goodsRequest.intermediary.email,
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
