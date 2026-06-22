"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// ============================================
// POST /auth/register
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        // Vérifie si l'email existe déjà
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }
        // Hash du mot de passe (10 rounds = sécurisé mais rapide)
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Création dans la base
        const user = await prisma.user.create({
            data: { email, passwordHash, firstName, lastName },
        });
        // Création du JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ============================================
// POST /auth/login
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ============================================
// GET /users/me (protégé par JWT)
// ============================================
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
exports.default = router;
