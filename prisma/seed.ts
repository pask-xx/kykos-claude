import { PrismaClient, Role, OrgType } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase connection for creating auth users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase: SupabaseClient = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, 'placeholder-anon-key');

async function main() {
  console.log('Creating seed data...');
  console.log('Note: Auth users require SUPABASE_SERVICE_ROLE_KEY env var');

  // For seed data without Supabase Auth (legacy approach for development)
  // Create users with passwordHash for backward compatibility

  // Create a simple hash function
  const encoder = new TextEncoder();
  async function simpleHash(password: string): Promise<string> {
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Create Admin
  const adminPassword = await simpleHash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kykos.it' },
    update: {},
    create: {
      email: 'admin@kykos.it',
      name: 'Admin KYKOS',
      passwordHash: adminPassword,
      role: 'ADMIN' as Role,
    },
  });
  console.log('Created admin:', admin.email);

  // Create Intermediaries
  const intermediaries = [
    {
      email: 'caritas.roma@kykos.it',
      name: 'Caritas Diocesana Roma',
      type: 'CHARITY' as OrgType,
      address: 'Roma, RM',
      code: 'CARITAS-ROM A',
    },
    {
      email: 'parrocchia.sangiovanni@kykos.it',
      name: 'Parrocchia San Giovanni',
      type: 'CHURCH' as OrgType,
      address: 'Roma, RM',
      code: 'PARROCCHIA-SGIOVANNI',
    },
    {
      email: 'associazione.arcobaleno@kykos.it',
      name: 'Associazione Arcobaleno',
      type: 'ASSOCIATION' as OrgType,
      address: 'Roma, RM',
      code: 'ASSOC-ARCOBALENO',
    },
  ];

  for (const data of intermediaries) {
    const password = await simpleHash('ente123');
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: password,
        role: 'INTERMEDIARY' as Role,
        intermediaryOrg: {
          create: {
            name: data.name,
            type: data.type,
            address: data.address,
            verified: true,
            code: data.code,
          },
        },
      },
      include: { intermediaryOrg: true },
    });
    console.log('Created intermediary:', user.email, '| Org:', user.intermediaryOrg?.name);
  }

  // Create a Donor
  const donorPassword = await simpleHash('donatore123');
  const donor = await prisma.user.upsert({
    where: { email: 'donatore@test.it' },
    update: {},
    create: {
      email: 'donatore@test.it',
      name: 'Mario Donatore',
      passwordHash: donorPassword,
      role: 'DONOR' as Role,
      donorProfile: {
        create: {
          level: 'BRONZE',
          totalDonations: 0,
          totalObjects: 0,
        },
      },
    },
  });
  console.log('Created donor:', donor.email);

  // Create a Recipient
  const recipientPassword = await simpleHash('ricevente123');
  const recipient = await prisma.user.upsert({
    where: { email: 'ricevente@test.it' },
    update: {},
    create: {
      email: 'ricevente@test.it',
      name: 'Giuseppe Ricevente',
      passwordHash: recipientPassword,
      role: 'RECIPIENT' as Role,
    },
  });
  console.log('Created recipient:', recipient.email);

  console.log('\n Seed completed!');
  console.log('\n Test accounts:');
  console.log('Admin: admin@kykos.it / admin123');
  console.log('Intermediario 1: caritas.roma@kykos.it / ente123');
  console.log('Intermediario 2: parrocchia.sangiovanni@kykos.it / ente123');
  console.log('Intermediario 3: associazione.arcobaleno@kykos.it / ente123');
  console.log('Donatore: donatore@test.it / donatore123');
  console.log('Ricevente: ricevente@test.it / ricevente123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
