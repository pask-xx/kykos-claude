import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export default async function RecipientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'RECIPIENT') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Fetch full user data on server side
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

  // Count pending: Consegne (donations with RESERVED) + Ritiri (requests with DEPOSITED + goodsRequests DELIVERED)
  const [deliveriesCount, objectPickupsCount, goodsPickupsCount] = await Promise.all([
    prisma.donation.count({
      where: {
        donorId: session.id,
        object: { status: 'RESERVED' },
      },
    }),
    prisma.request.count({
      where: {
        recipientId: session.id,
        object: { status: 'DEPOSITED' },
      },
    }),
    prisma.goodsRequest.count({
      where: {
        beneficiaryId: session.id,
        status: 'DELIVERED',
      },
    }),
  ]);

  const pendingDeliveryCount = deliveriesCount + objectPickupsCount + goodsPickupsCount;

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
