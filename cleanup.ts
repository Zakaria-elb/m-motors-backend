import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.document.deleteMany();
  await prisma.dossierHistory.deleteMany();
  await prisma.dossier.deleteMany();
  console.log('✅ Tous les dossiers fantômes ont été supprimés');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
