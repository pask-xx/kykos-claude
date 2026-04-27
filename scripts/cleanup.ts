/**
 * Script di pulizia del database KYKOS
 * ATTENZIONE: Elimina tutti i dati degli utenti, oggetti, richieste, donazioni, ecc.
 *
 * Utilizzo: npx tsx scripts/cleanup.ts
 *
 * Oppure direttamente con ts-node o via Prisma Studio per visualizzare prima.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 INIZIO PULIZIA DATABASE KYKOS');
  console.log('================================\n');

  // Mostra conteggi prima della pulizia
  console.log('📊 Stato attuale:');
  const [
    userCount,
    objectCount,
    requestCount,
    donationCount,
    paymentCount,
    operatorCount,
    organizationCount,
    donorProfileCount,
    notificationCount,
    reportCount,
    goodsRequestCount,
    goodsOfferCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.object.count(),
    prisma.request.count(),
    prisma.donation.count(),
    prisma.payment.count(),
    prisma.operator.count(),
    prisma.organization.count(),
    prisma.donorProfile.count(),
    prisma.notification.count(),
    prisma.report.count(),
    prisma.goodsRequest.count(),
    prisma.goodsOffer.count(),
  ]);

  console.log(`  - Utenti: ${userCount}`);
  console.log(`  - Oggetti: ${objectCount}`);
  console.log(`  - Richieste: ${requestCount}`);
  console.log(`  - Donazioni: ${donationCount}`);
  console.log(`  - Pagamenti: ${paymentCount}`);
  console.log(`  - Operatori: ${operatorCount}`);
  console.log(`  - Organizzazioni: ${organizationCount}`);
  console.log(`  - Profili Donatore: ${donorProfileCount}`);
  console.log(`  - Notifiche: ${notificationCount}`);
  console.log(`  - Segnalazioni: ${reportCount}`);
  console.log(`  - Richieste Beni: ${goodsRequestCount}`);
  console.log(`  - Offerte Beni: ${goodsOfferCount}`);

  console.log('\n⚠️  ELIMINAZIONE IN CORSO...\n');

  // Ordine di eliminazione (rispetta le foreign keys)
  // 1. Notifiche (dipendono da User e Operator)
  console.log('1️⃣  Eliminazione notifiche...');
  await prisma.notification.deleteMany({});

  // 2. Segnalazioni (Report)
  console.log('2️⃣  Eliminazione segnalazioni...');
  await prisma.report.deleteMany({});

  // 3. Offerte Beni (GoodsOffer)
  console.log('3️⃣  Eliminazione offerte beni...');
  await prisma.goodsOffer.deleteMany({});

  // 4. Richieste Beni (GoodsRequest)
  console.log('4️⃣  Eliminazione richieste beni...');
  await prisma.goodsRequest.deleteMany({});

  // 5. Pagamenti (Payment) - senza cascade a entità critiche
  console.log('5️⃣  Eliminazione pagamenti...');
  await prisma.payment.deleteMany({});

  // 6. Donazioni (Donation) - dipende da Request e Payment
  console.log('6️⃣  Eliminazione donazioni...');
  await prisma.donation.deleteMany({});

  // 7. Richieste (Request) - dipende da Object e User
  console.log('7️⃣  Eliminazione richieste...');
  await prisma.request.deleteMany({});

  // 8. Oggetti (Object) - dipende da User e Organization
  console.log('8️⃣  Eliminazione oggetti...');
  await prisma.object.deleteMany({});

  // 9. Profili Donatore (DonorProfile) - dipende da User
  console.log('9️⃣  Eliminazione profili donatore...');
  await prisma.donorProfile.deleteMany({});

  // 10. Operatori (Operator) - dipende da Organization
  console.log('🔟 Eliminazione operatori...');
  await prisma.operator.deleteMany({});

  // 11. Utenti (User) - cascade elimina le relationi
  console.log('1️⃣1️⃣ Eliminazione utenti...');
  await prisma.user.deleteMany({});

  // 12. Organizzazioni (Organization) - per ultime
  console.log('1️⃣2️⃣ Eliminazione organizzazioni...');
  await prisma.organization.deleteMany({});

  console.log('\n✅ PULIZIA COMPLETATA!\n');

  // Mostra conteggi dopo la pulizia
  console.log('📊 Stato dopo pulizia:');
  const [
    userCountAfter,
    objectCountAfter,
    requestCountAfter,
    donationCountAfter,
    paymentCountAfter,
    operatorCountAfter,
    organizationCountAfter,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.object.count(),
    prisma.request.count(),
    prisma.donation.count(),
    prisma.payment.count(),
    prisma.operator.count(),
    prisma.organization.count(),
  ]);

  console.log(`  - Utenti: ${userCountAfter}`);
  console.log(`  - Oggetti: ${objectCountAfter}`);
  console.log(`  - Richieste: ${requestCountAfter}`);
  console.log(`  - Donazioni: ${donationCountAfter}`);
  console.log(`  - Pagamenti: ${paymentCountAfter}`);
  console.log(`  - Operatori: ${operatorCountAfter}`);
  console.log(`  - Organizzazioni: ${organizationCountAfter}`);
}

cleanup()
  .catch((e) => {
    console.error('❌ ERRORE DURANTE LA PULIZIA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
