import { Router } from 'express';
import { PrismaClient, VehicleType } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CONFIGURATION MULTER (upload images)
// ============================================
const uploadDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier image uniquement (JPG, PNG, WEBP)'));
  }
});

// ============================================
// GET /vehicles (RECHERCHE MULTI-CRITÈRES)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { brand, model, minPrice, maxPrice, maxMileage, type, status } = req.query;

    console.log('🔥 REQ.QUERY:', req.query);

    const where: any = {};

    // Filtre statut stock (A_VENDRE, EN_LOCATION, LES_DEUX...)
    if (status) {
      where.status = status as string;
    }

    // Filtre type d'offre (ACHAT / LOCATION / LES_DEUX)
    if (type && type !== 'ALL') {
      const typeValue = type as string;
      if (typeValue === 'ACHAT') {
        where.type = { in: ['ACHAT', 'LES_DEUX'] };
      } else if (typeValue === 'LOCATION') {
        where.type = { in: ['LOCATION', 'LES_DEUX'] };
      } else {
        where.type = typeValue;
      }
    }

    // VALIDATION des fourchettes
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ message: 'Fourchette de prix incohérente (min > max)' });
    }
    if (minPrice && Number(minPrice) < 0) {
      return res.status(400).json({ message: 'Le prix minimum ne peut pas être négatif' });
    }
    if (maxPrice && Number(maxPrice) < 0) {
      return res.status(400).json({ message: 'Le prix maximum ne peut pas être négatif' });
    }
    if (maxMileage && Number(maxMileage) < 0) {
      return res.status(400).json({ message: 'Le kilométrage ne peut pas être négatif' });
    }

    // Recherche texte (insensible à la casse — PostgreSQL/Prisma)
    if (brand) {
      where.brand = { contains: brand as string, mode: 'insensitive' };
    }
    if (model) {
      where.model = { contains: model as string, mode: 'insensitive' };
    }

    // Fourchette de prix
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Kilométrage max
    if (maxMileage) {
      where.mileage = { lte: Number(maxMileage) };
    }

    console.log('📦 WHERE PRISMA:', JSON.stringify(where, null, 2));

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ RESULTATS:', vehicles.length, 'véhicules trouvés');
    res.json(vehicles);
  } catch (error: any) {
    console.error('❌ ERREUR GET /vehicles:', error.message);
    res.status(500).json({ message: 'Erreur serveur', detail: error.message });
  }
});

// ============================================
// GET /vehicles/:id (détail)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id as string },
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule introuvable' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================
// POST /vehicles (création + upload image)
// ============================================
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // URL relative pour le proxy Next.js (/uploads -> localhost:3001)
    const imageUrl = req.file
      ? `/uploads/vehicles/${req.file.filename}`
      : undefined;

    const vehicle = await prisma.vehicle.create({
      data: {
        brand: req.body.brand,
        model: req.body.model,
        year: Number(req.body.year),
        mileage: Number(req.body.mileage),
        price: req.body.price ? Number(req.body.price) : null,
        monthlyPrice: req.body.monthlyPrice ? Number(req.body.monthlyPrice) : null,
        status: req.body.status,
        type: req.body.type,
        description: req.body.description || '',
        imageUrls: imageUrl ? [imageUrl] : [],
      }
    });

    res.json(vehicle);
  } catch (error: any) {
    console.error('❌ ERREUR POST /vehicles:', error.message);
    res.status(500).json({ message: 'Erreur serveur', detail: error.message });
  }
});


// DELETE /vehicles/:id

router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Véhicule supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// PATCH /vehicles/:id/bascule
router.patch('/:id/bascule', async (req, res) => {
  try {
    const { status, price, monthlyPrice } = req.body;
    let forcedType: VehicleType;
    if (status === 'A_VENDRE' || status === 'VENDU') forcedType = 'ACHAT';
    else if (status === 'EN_LOCATION' || status === 'LOUE') forcedType = 'LOCATION';
    else forcedType = 'LES_DEUX';

    const data: any = { status: status as any, type: forcedType };
    if (price !== undefined && price !== null && price !== '') data.price = Number(price);
    if (monthlyPrice !== undefined && monthlyPrice !== null && monthlyPrice !== '') data.monthlyPrice = Number(monthlyPrice);

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(vehicle);
  } catch (error) {
    console.error('Erreur PATCH bascule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


export default router;
