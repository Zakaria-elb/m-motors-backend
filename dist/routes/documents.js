"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const uploadDir = path_1.default.join(__dirname, '../../uploads/documents');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo par fichier
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Format non autorisé (PDF, JPG, PNG uniquement)'));
    }
});
// POST /documents
router.post('/', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { dossierId } = req.body;
        const file = req.file;
        if (!file)
            return res.status(400).json({ message: 'Fichier manquant' });
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
    }
    catch (error) {
        console.error('❌ ERREUR POST /documents:', error.message);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});
exports.default = router;
