"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();

// CONFIG upload images

const uploadDir = path_1.default.join(__dirname, '../../uploads/vehicles');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Fichier image uniquement (JPG, PNG, WEBP)'));
    }
});

// recherche multicritères

router.get('/', async (req, res) => {
    try {
        const { brand, model, minPrice, maxPrice, maxMileage, type, status } = req.query;
        console.log('🔥 REQ.QUERY:', req.query);
        const where = {};
        // Filtre statut 
        if (status) {
            where.status = status;
        }
        // Filtre type d'offre 
        if (type && type !== 'ALL') {
            const typeValue = type;
            if (typeValue === 'ACHAT') {
                where.type = { in: ['ACHAT', 'LES_DEUX'] };
            }
            else if (typeValue === 'LOCATION') {
                where.type = { in: ['LOCATION', 'LES_DEUX'] };
            }
            else {
                where.type = typeValue;
            }
        }
        // VALIDATION 
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
        // Recherche texte 
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }
        if (model) {
            where.model = { contains: model, mode: 'insensitive' };
        }
        // fourchette prix
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = Number(minPrice);
            if (maxPrice)
                where.price.lte = Number(maxPrice);
        }
        // Kilométrage 
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
    }
    catch (error) {
        console.error('❌ ERREUR GET /vehicles:', error.message);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

// GET /vehicles/:id 

router.get('/:id', async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id },
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Véhicule introuvable' });
        }
        res.json(vehicle);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// POST /vehicles (création + upload image)

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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PATCH /vehicles/:id/bascule 

router.patch('/:id/bascule', async (req, res) => {
    try {
        const { status, price, monthlyPrice } = req.body;
        let forcedType;
        if (status === 'A_VENDRE' || status === 'VENDU')
            forcedType = 'ACHAT';
        else if (status === 'EN_LOCATION' || status === 'LOUE')
            forcedType = 'LOCATION';
        else
            forcedType = 'LES_DEUX';
        const data = { status: status, type: forcedType };
        if (price !== undefined && price !== null && price !== '')
            data.price = Number(price);
        if (monthlyPrice !== undefined && monthlyPrice !== null && monthlyPrice !== '')
            data.monthlyPrice = Number(monthlyPrice);
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data,
        });
        res.json(vehicle);
    }
    catch (error) {
        console.error('Erreur PATCH bascule:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
exports.default = router;
