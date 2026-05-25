import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Loading diocesi from JSON...');

  // Dynamic import for JSON
  const diocesi = require('./DiocesiItaliane.json');

  console.log(`Found ${diocesi.length} diocesi`);

  // Clear existing dioceses
  await prisma.diocese.deleteMany({});
  console.log('Cleared existing dioceses');

  // Insert dioceses
  for (const d of diocesi) {
    await prisma.diocese.create({
      data: {
        name: d.diocesi,
        seat: d.sede,
        latitude: d.lat,
        longitude: d.lon,
      },
    });
  }

  console.log(`Inserted ${diocesi.length} diocesi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
