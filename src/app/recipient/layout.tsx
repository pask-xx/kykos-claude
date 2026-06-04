import { prisma } from '@/lib/prisma';
import { KYKOS_VIEWPORT, requireUserSession } from '@/lib/layout-helper';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const viewport = KYKOS_VIEWPORT;

export default async function RecipientLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUserSession('RECIPIENT');

  // Recipient-specific extras
  const hasApprovedVolunteer = !!(await prisma.volunteerAssociation.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    select: { id: true },
  }));

  // Pending: deliveries (donations RESERVED) + pickups (requests DEPOSITED, goodsRequests DELIVERED)
  const [deliveriesCount, objectPickupsCount, goodsPickupsCount] = await Promise.all([
    prisma.donation.count({
      where: { donorId: user.id, object: { status: 'RESERVED' } },
    }),
    prisma.request.count({
      where: { recipientId: user.id, object: { status: 'DEPOSITED' } },
    }),
    prisma.goodsRequest.count({
      where: { beneficiaryId: user.id, status: 'DELIVERED' },
    }),
  ]);
  const pendingDeliveryCount =
    deliveriesCount + objectPickupsCount + goodsPickupsCount;

  return (
    <DashboardLayoutClient
      user={user}
      hasApprovedVolunteer={hasApprovedVolunteer}
      pendingDeliveryCount={pendingDeliveryCount}
    >
      {children}
    </DashboardLayoutClient>
  );
}
