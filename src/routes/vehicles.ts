import { Router } from 'express';
import { PrismaClient, VehicleType } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// === Multer config ===
const uploadDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier image uniquement (JPG, PNG, WEBP)'));
  }
});

// GET /vehicles
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (type) {
      const tv = type as string;
      if (tv === 'ACHAT') where.type = { in: ['ACHAT', 'LES_DEUX'] };
      else if (tv === 'LOCATION') where.type = { in: ['LOCATION', 'LES_DEUX'] };
      else where.type = tv;
    }
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(vehicles);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// GET /vehicles/:id
// GET /vehicles (liste avec filtres intelligents et recherche multi-critères)
router.get('/', async (req, res) => {
  try {
    const { brand, model, minPrice, maxPrice, maxMileage, type, status } = req.query;
    
    const where: any = {};

    // Filtre statut stock
    if (status) where.status = status as string;

    // Filtre type d'offre (ACHAT, LOCATION, LES_DEUX)
    if (type) {
      const typeValue = type as string;
      if (typeValue === 'ACHAT') {
        where.type = { in: ['ACHAT', 'LES_DEUX'] };
      } else if (typeValue === 'LOCATION') {
        where.type = { in: ['LOCATION', 'LES_DEUX'] };
      } else {
        where.type = typeValue;
      }
    }

    // Validation fourchettes
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

    // Recherche texte (insensible à la casse)
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

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// POST /vehicles — AVEC upload fichier
router.post('/', upload.single('image'), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /vehicles/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
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
    if (price !== undefined && price !== null) data.price = Number(price);
    if (monthlyPrice !== undefined && monthlyPrice !== null) data.monthlyPrice = Number(monthlyPrice);

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(vehicle);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

export default router;
