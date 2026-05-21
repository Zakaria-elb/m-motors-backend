import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: await bcrypt.hash('AdminPass123!', 10),
      firstName: 'Admin',
      lastName: 'M-Motors',
      role: 'ADMIN',
    },
  });
  
  // Créer un client
  const client = await prisma.user.create({
    data: {
      email: 'client@test.com',
      passwordHash: await bcrypt.hash('ClientPass123!', 10),
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'CLIENT',
    },
  });

  // Créer quelques véhicules
  await prisma.vehicle.createMany({
    data: [
      {
        brand: 'Renault',
        model: 'Clio',
        year: 2021,
        mileage: 35000,
        price: 14500.00,
        monthlyPrice: 250.00,
        status: 'A_VENDRE',
        type: 'LES_DEUX',
        description: 'Clio 5 en excellent état, entretien régulier.',
        imageUrls: ['https://via.placeholder.com/400'],
        options: { assurance: true, entretien: true },
      },
      {
        brand: 'Peugeot',
        model: '3008',
        year: 2022,
        mileage: 18000,
        price: 28900.00,
        monthlyPrice: 450.00,
        status: 'EN_LOCATION',
        type: 'LOCATION',
        description: 'SUV compact idéal pour la location longue durée.',
        imageUrls: ['https://via.placeholder.com/400'],
        options: { assurance: true, entretien: true, assistance: true },
      },
    ],
  });

  console.log('✅ Seed terminé');
  console.log('Admin:', admin.email, '/ AdminPass123!');
  console.log('Client:', client.email, '/ ClientPass123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
