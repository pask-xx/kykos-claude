import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { generatePickupQrCode, generateAndUploadQrCodeWithLogo } from '@/lib/qrcode';
import { getJwtSecret } from '@/lib/auth';

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

// GET /api/operator/street-to-deliver - lista ritiri pendenti per operatori street
export async function GET() {
  try {
    const session = await getOperatorSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!session.isStreetOperator) {
      return NextResponse.json({ error: 'Solo operatori di strada' }, { status: 403 });
    }

    // Get all beneficiaries assigned to this street operator
    const assignments = await prisma.streetOperatorBeneficiary.findMany({
      where: { streetOperatorId: session.operatorId },
      select: { beneficiaryId: true },
    });

    const beneficiaryIds = assignments.map(a => a.beneficiaryId);

    if (beneficiaryIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Fetch Object Requests (ritiri) - where object is DEPOSITED and beneficiary is street-managed
    const objectRequests = await prisma.request.findMany({
      where: {
        recipientId: { in: beneficiaryIds },
        object: { status: 'DEPOSITED' },
      },
      include: {
        object: {
          select: {
            id: true,
            title: true,
            category: true,
            condition: true,
            status: true,
            imageUrls: true,
            depositLocation: true,
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
            hoursInfo: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            address: true,
            houseNumber: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Goods Requests DELIVERED - items to deliver to street beneficiaries
    const goodsRequestsDelivered = await prisma.goodsRequest.findMany({
      where: {
        beneficiaryId: { in: beneficiaryIds },
        status: 'DELIVERED',
      },
      include: {
        intermediary: {
          select: {
            id: true,
            name: true,
            address: true,
            houseNumber: true,
            cap: true,
            city: true,
            province: true,
            hoursInfo: true,
          },
        },
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            address: true,
            houseNumber: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build unified list
    type EntityInfo = {
      id: string;
      name: string;
      address: string | null;
      houseNumber: string | null;
      cap: string | null;
      city: string | null;
      province: string | null;
      hoursInfo: string | null;
    };

    const items: Array<{
      id: string;
      type: 'OBJECT' | 'GOODS';
      title: string;
      category: string;
      status: string;
      statusLabel: string;
      imageUrls: string[];
      depositLocation?: string | null;
      objectId?: string;
      goodsRequestId?: string;
      beneficiaryId: string;
      beneficiaryName: string;
      beneficiaryNickname: string | null;
      beneficiaryAddress: string | null;
      createdAt: string;
      qrData: string;
      qrImageUrl?: string;
      entity: EntityInfo;
    }> = [];

    // Process Object Requests (ritiri - object deposited, beneficiary comes to pick up)
    for (const req of objectRequests) {
      const nickname = req.recipient.nickname || req.recipient.firstName;
      const qrData = generatePickupQrCode(req.id, req.recipient.id, 'object');

      // Generate QR image URL
      let qrImageUrl: string | undefined;
      try {
        qrImageUrl = await generateAndUploadQrCodeWithLogo(qrData, 'street-pickup-' + req.id + '.png');
      } catch (err) {
        console.error('Error generating QR for object request:', err);
      }

      items.push({
        id: req.id,
        type: 'OBJECT',
        title: req.object.title,
        category: req.object.category,
        status: req.object.status,
        statusLabel: 'Ritiro Disponibilita',
        imageUrls: req.object.imageUrls || [],
        depositLocation: req.object.depositLocation,
        objectId: req.object.id,
        beneficiaryId: req.recipient.id,
        beneficiaryName: req.recipient.firstName + ' ' + req.recipient.lastName,
        beneficiaryNickname: req.recipient.nickname,
        beneficiaryAddress: req.recipient.address ? req.recipient.address + (req.recipient.houseNumber ? ', ' + req.recipient.houseNumber : '') + (req.recipient.city ? ' - ' + req.recipient.city : '') : (req.recipient.city ? req.recipient.city : null),
        createdAt: req.createdAt.toISOString(),
        qrData,
        qrImageUrl,
        entity: {
          id: req.intermediary.id,
          name: req.intermediary.name,
          address: req.intermediary.address,
          houseNumber: req.intermediary.houseNumber,
          cap: req.intermediary.cap,
          city: req.intermediary.city,
          province: req.intermediary.province,
          hoursInfo: req.intermediary.hoursInfo,
        },
      });
    }

    // Process Goods Requests (consegne - goods delivered to operator, to give to beneficiary)
    for (const gr of goodsRequestsDelivered) {
      const nickname = gr.beneficiary.nickname || gr.beneficiary.firstName;
      const qrData = generatePickupQrCode(gr.id, gr.beneficiary.id, 'goods');

      let qrImageUrl: string | undefined;
      try {
        qrImageUrl = await generateAndUploadQrCodeWithLogo(qrData, 'street-goods-' + gr.id + '.png');
      } catch (err) {
        console.error('Error generating QR for goods request:', err);
      }

      items.push({
        id: gr.id,
        type: 'GOODS',
        title: gr.title,
        category: gr.category,
        status: gr.status,
        statusLabel: 'Ritiro Richiesta',
        imageUrls: [],
        beneficiaryId: gr.beneficiary.id,
        beneficiaryName: gr.beneficiary.firstName + ' ' + gr.beneficiary.lastName,
        beneficiaryNickname: gr.beneficiary.nickname,
        beneficiaryAddress: gr.beneficiary.address ? gr.beneficiary.address + (gr.beneficiary.houseNumber ? ', ' + gr.beneficiary.houseNumber : '') + (gr.beneficiary.city ? ' - ' + gr.beneficiary.city : '') : (gr.beneficiary.city ? gr.beneficiary.city : null),
        createdAt: gr.createdAt.toISOString(),
        qrData,
        qrImageUrl,
        entity: {
          id: gr.intermediary.id,
          name: gr.intermediary.name,
          address: gr.intermediary.address,
          houseNumber: gr.intermediary.houseNumber,
          cap: gr.intermediary.cap,
          city: gr.intermediary.city,
          province: gr.intermediary.province,
          hoursInfo: gr.intermediary.hoursInfo,
        },
      });
    }

    // Sort by createdAt desc (newest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Street to deliver error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}