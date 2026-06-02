import { prisma } from '@/lib/prisma';
import { KYKOS_VIEWPORT, requireUserSession } from '@/lib/layout-helper';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const viewport = KYKOS_VIEWPORT;

export default async function DonorLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUserSession('DONOR');

  // Donor-specific extras
  const hasApprovedVolunteer = !!(await prisma.volunteerAssociation.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    select: { id: true },
  }));

  // Pending deliveries: RESERVED donations + ACCEPTED goods offers
  const [reservedObjectsCount, acceptedGoodsCount] = await Promise.all([
    prisma.donation.count({
      where: { donorId: user.id, object: { status: 'RESERVED' } },
    }),
    prisma.goodsOffer.count({
      where: { offeredById: user.id, status: 'ACCEPTED' },
    }),
  ]);
  const pendingDeliveryCount = reservedObjectsCount + acceptedGoodsCount;

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
