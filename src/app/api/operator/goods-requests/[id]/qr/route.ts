import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { generateAndUploadQrCodeWithLogo, generateDeliverQrCode, generatePickupQrCode } from '@/lib/qrcode';
import { getJwtSecret } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api';

const JWT_SECRET = getJwtSecret();

interface OperatorSession {
  operatorId: string;
  organizationId: string;
  username: string;
  role: string;
  isStreetOperator: boolean;
  isOfficeOperator: boolean;
}

async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('operator_session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {

  const session = await getOperatorSession();

  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { id: requestId } = await params;

  // Fetch goods request - verify it's associated with this operator's organization
  const goodsRequest = await prisma.goodsRequest.findUnique({
    where: { id: requestId },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          nickname: true,
        },
      },
      fulfilledBy: {
        select: {
          id: true,
          name: true,
        },
      },
      intermediary: {
        select: {
          id: true,
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

  // Verify the intermediary is this operator's organization
  if (goodsRequest.intermediaryId !== session.organizationId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  // Generate QR codes
  const deliverQrData = generateDeliverQrCode(requestId, goodsRequest.fulfilledById || '', 'goods');
  const pickupQrData = generatePickupQrCode(requestId, goodsRequest.beneficiaryId, 'goods');
  const deliverQrImage = await generateAndUploadQrCodeWithLogo(deliverQrData, `goods-deliver-${requestId}.png`);
  const pickupQrImage = await generateAndUploadQrCodeWithLogo(pickupQrData, `goods-pickup-${requestId}.png`);

  return NextResponse.json({
    goodsRequest: {
      id: goodsRequest.id,
      title: goodsRequest.title,
      status: goodsRequest.status,
      beneficiary: goodsRequest.beneficiary,
      fulfilledBy: goodsRequest.fulfilledBy,
    },
    qrCodes: {
      deliver: {
        type: 'deliver',
        data: deliverQrData,
        imageUrl: deliverQrImage,
        label: 'Consegna',
        description: "QR code per il donatore per consegnare il bene all'ente",
      },
      pickup: {
        type: 'pickup',
        data: pickupQrData,
        imageUrl: pickupQrImage,
        label: 'Ritiro',
        description: "QR code per il beneficiario per ritirare il bene dall'ente",
      },
    },
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

}, 'GET /api/operator/goods-requests/[id]/qr');