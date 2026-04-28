import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateAndUploadQrCode, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';

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
          },
        },
        fulfilledBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    const deliverQrData = generateDeliverQrCode(requestId, goodsRequest.fulfilledById!);
    const pickupQrData = generatePickupQrCode(requestId, goodsRequest.beneficiaryId);
    const deliverQrImage = await generateAndUploadQrCode(deliverQrData, `goods-deliver-${requestId}.png`);
    const pickupQrImage = await generateAndUploadQrCode(pickupQrData, `goods-pickup-${requestId}.png`);

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
      entityAddress: goodsRequest.intermediary.address,
      entityHouseNumber: goodsRequest.intermediary.houseNumber,
      entityCap: goodsRequest.intermediary.cap,
      entityCity: goodsRequest.intermediary.city,
      entityProvince: goodsRequest.intermediary.province,
      entityPhone: goodsRequest.intermediary.phone,
      entityEmail: goodsRequest.intermediary.email,
    });
  } catch (error) {
    console.error('QR code API error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
