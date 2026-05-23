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
        model: 'Clio V',
        year: 2021,
        mileage: 35000,
        price: 14500.00,
        monthlyPrice: 250.00,
        status: 'A_VENDRE',
        type: 'LES_DEUX',
        description: 'Clio 5 Intens en excellent état. Entretien complet, garantie 6 mois. Consommation réduite, parfaite en ville.',
        imageUrls: ['https://placehold.co/600x400/003087/FFF?text=Renault+Clio+V'],
        options: { assurance: true, entretien: true },
      },
      {
        brand: 'Peugeot',
        model: '3008 GT',
        year: 2022,
        mileage: 18000,
        price: 28900.00,
        monthlyPrice: 450.00,
        status: 'EN_LOCATION',
        type: 'LOCATION',
        description: 'SUV compact premium avec hayon électrique. Idéal pour la location longue durée. Toit panoramique, cuir.',
        imageUrls: ['https://placehold.co/600x400/000000/FFF?text=Peugeot+3008+GT'],
        options: { assurance: true, entretien: true, assistance: true },
      },
      {
        brand: 'Volkswagen',
        model: 'Golf 8',
        year: 2020,
        mileage: 52000,
        price: 18900.00,
        monthlyPrice: 320.00,
        status: 'A_VENDRE',
        type: 'ACHAT',
        description: 'Golf 8 Carat DSG7. Full LED, cockpit digital, Apple CarPlay. Historique entretien VW complet.',
        imageUrls: ['https://placehold.co/600x400/001e50/FFF?text=VW+Golf+8'],
        options: { entretien: true },
      },
      {
        brand: 'Tesla',
        model: 'Model 3',
        year: 2023,
        mileage: 12000,
        price: 34900.00,
        monthlyPrice: 580.00,
        status: 'LES_DEUX',
        type: 'LES_DEUX',
        description: 'Tesla Model 3 Propulsion. Autonomie 510km, Autopilot, recharge gratuite Supercharger 1 an.',
        imageUrls: ['https://placehold.co/600x400/cc0000/FFF?text=Tesla+Model+3'],
        options: { assurance: true, entretien: true, assistance: true },
      },
      {
        brand: 'BMW',
        model: 'Série 1',
        year: 2019,
        mileage: 67000,
        price: 21500.00,
        monthlyPrice: 380.00,
        status: 'A_VENDRE',
        type: 'LES_DEUX',
        description: '118i M Sport, pack esthétique, jantes 18 pouces. Carnet BMW tamponné, distribution neuve.',
        imageUrls: ['https://placehold.co/600x400/0066b1/FFF?text=BMW+Serie+1'],
        options: { entretien: true },
      },
      {
        brand: 'Citroën',
        model: 'C4 Cactus',
        year: 2021,
        mileage: 28000,
        price: 12900.00,
        monthlyPrice: 210.00,
        status: 'EN_LOCATION',
        type: 'LOCATION',
        description: 'Confort absolu avec les Airbumps. Faible consommation, parfait pour les trajets urbains en LLD.',
        imageUrls: ['https://placehold.co/600x400/e3001b/FFF?text=Citroen+C4+Cactus'],
        options: { assurance: true, entretien: true },
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
