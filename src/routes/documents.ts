import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const uploadDir = path.join(__dirname, '../../uploads/documents');
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo par fichier
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format non autorisé (PDF, JPG, PNG uniquement)'));
  }
});

// POST /documents
router.post('/', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const { dossierId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'Fichier manquant' });

    const document = await prisma.document.create({
      data: {
        dossierId,
        originalName: file.originalname,
        s3Key: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });

    res.json(document);
  } catch (error: any) {
    console.error('❌ ERREUR POST /documents:', error.message);
    res.status(500).json({ message: 'Erreur serveur', detail: error.message });
  }
});

export default router;

