import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default async function DonorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'DONOR') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      profileImageUrl: true,
    },
  });

  // Check if user has any approved volunteer associations
  const hasApprovedVolunteer = await prisma.volunteerAssociation.findFirst({
    where: {
      userId: session.id,
      status: 'APPROVED',
    },
    select: { id: true },
  }).then(result => !!result);

  // Count pending deliveries (object donations with RESERVED status + goods offers with ACCEPTED status)
  const [reservedObjectsCount, acceptedGoodsCount] = await Promise.all([
    prisma.donation.count({
      where: {
        donorId: session.id,
        object: { status: 'RESERVED' },
      },
    }),
    prisma.goodsOffer.count({
      where: {
        offeredById: session.id,
        status: 'ACCEPTED',
      },
    }),
  ]);

  const pendingDeliveryCount = reservedObjectsCount + acceptedGoodsCount;

  const userData = user ? {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    profileImageUrl: user.profileImageUrl,
  } : null;

  return (
    <DashboardLayoutClient user={userData} hasApprovedVolunteer={hasApprovedVolunteer} pendingDeliveryCount={pendingDeliveryCount}>
      {children}
    </DashboardLayoutClient>
  );
}
