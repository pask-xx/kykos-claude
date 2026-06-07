import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Gift, Heart, Trophy, Package, User, ArrowLeft, Inbox } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DONOR_LEVEL_LABELS, OBJECT_STATUS_LABELS } from '@/types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui';

/**
 * Mappa Object.status → Badge variant KYKOS.
 * vedi: src/types/ObjectStatus per i 6 stati.
 */
function objectStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE': return { variant: 'success' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    case 'RESERVED': return { variant: 'warning' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    case 'DEPOSITED': return { variant: 'primary' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    case 'DONATED': return { variant: 'default' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    case 'CANCELLED': return { variant: 'danger' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    case 'BLOCKED': return { variant: 'warning' as const, label: OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status };
    default: return { variant: 'default' as const, label: status };
  }
}

/**
 * Mappa DonorProfile.level → Badge variant KYKOS.
 * vedi: src/types/DonorLevel.
 */
function donorLevelBadge(level: string) {
  switch (level) {
    case 'GOLD': return { variant: 'warning' as const };
    case 'SILVER': return { variant: 'default' as const };
    case 'BRONZE':
    default: return { variant: 'warning' as const };
  }
}

export default async function DonorStatistics() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  if (session.role !== 'DONOR') {
    redirect(`/${session.role.toLowerCase()}/dashboard`);
  }

  // Parallel queries for better performance
  const [user, donatedObjects, totalDonations, recentObjects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        fiscalCode: true,
        address: true,
        houseNumber: true,
        cap: true,
        city: true,
        createdAt: true,
        donorProfile: true,
      },
    }),
    prisma.object.count({
      where: { donorId: session.id },
    }),
    prisma.donation.aggregate({
      where: { donorId: session.id },
      _sum: { amount: true },
    }),
    prisma.object.findMany({
      where: { donorId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const level = user?.donorProfile?.level || 'BRONZE';
  const levelLabel = DONOR_LEVEL_LABELS[level] || 'Bronzo';
  const levelBadge = donorLevelBadge(level);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiche</h1>
            <p className="text-gray-500 text-sm mt-1">La tua attività su KYKOS</p>
          </div>
          <Link href="/donor/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              Richieste
            </Button>
          </Link>
        </div>

        {/* Personal Data Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" aria-hidden="true" />
              Dati anagrafici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nome completo</p>
                <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Codice Fiscale</p>
                <p className="font-medium text-gray-900 uppercase">{user?.fiscalCode || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Indirizzo</p>
                <p className="font-medium text-gray-900">
                  {user?.address ? `${user.address}, ${user.houseNumber || ''}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">CAP / Città</p>
                <p className="font-medium text-gray-900">
                  {user?.cap ? `${user.cap} ${user.city || ''}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Membro dal</p>
                <p className="font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Oggetti donati</p>
                <p className="text-xl font-bold text-gray-900">{donatedObjects}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-secondary-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Donazioni totali</p>
                <p className="text-xl font-bold text-gray-900">
                  €{totalDonations._sum.amount ? Number(totalDonations._sum.amount).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Livello</p>
                <Badge variant={levelBadge.variant}>{levelLabel}</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Attività recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentObjects.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nessuna attività recente"
                description="Inizia donando un oggetto!"
              />
            ) : (
              <div className="space-y-3">
                {recentObjects.map((obj) => {
                  const statusBadge = objectStatusBadge(obj.status);
                  return (
                    <div key={obj.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {obj.imageUrls && obj.imageUrls.length > 0 ? (
                          <img src={obj.imageUrls[0]} alt={obj.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{obj.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(obj.createdAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
