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

  // cerate cars
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
        imageUrls: ['/vehicles/clio.jpg'],
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
        imageUrls: ['/vehicles/3008.jpg'],
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
        imageUrls: ['/vehicles/golf.jpg'],
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
        imageUrls: ['/vehicles/tesla.jpg'],
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
        imageUrls: ['/vehicles/bmw.jpg'],
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
        imageUrls: ['/vehicles/cactus.jpg'],
        options: { assurance: true, entretien: true },
      },
      {
        brand: 'Audi',
        model: 'A3 Sportback',
        year: 2019,
        mileage: 42000,
        price: 24500.00,
        monthlyPrice: 380.00,
        status: 'A_VENDRE',
        type: 'LES_DEUX',
        description: 'A3 Sportback Ambition Luxe. Matrix LED, virtual cockpit, Bang & Olufsen. Première main.',
        imageUrls: ['/vehicles/audi.jpg'],
        options: { assurance: true, entretien: true, assistance: true },
      },
      {
        brand: 'Toyota',
        model: 'Yaris Hybrid',
        year: 2022,
        mileage: 15000,
        price: 19500.00,
        monthlyPrice: 290.00,
        status: 'A_VENDRE',
        type: 'ACHAT',
        description: 'Yaris Hybrid 116h Collection. Consommation record de 3,3L/100km. Garantie hybride 10 ans.',
        imageUrls: ['/vehicles/yaris.jpg'],
        options: { entretien: true },
      },
      {
        brand: 'Mercedes',
        model: 'Classe A',
        year: 2021,
        mileage: 30000,
        price: 32500.00,
        monthlyPrice: 520.00,
        status: 'EN_LOCATION',
        type: 'LOCATION',
        description: 'Classe A 200 AMG Line. Intérieur premium, écran tactile 10", aide au stationnement 360°.',
        imageUrls: ['/vehicles/mercedes.jpg'],
        options: { assurance: true, entretien: true, assistance: true },
      },
      {
        brand: 'Ford',
        model: 'Puma',
        year: 2020,
        mileage: 48000,
        price: 16800.00,
        monthlyPrice: 270.00,
        status: 'LES_DEUX',
        type: 'LES_DEUX',
        description: 'Puma ST-Line X. Toit ouvrant panoramique, sièges chauffants, régulateur adaptatif.',
        imageUrls: ['/vehicles/puma.jpg'],
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
