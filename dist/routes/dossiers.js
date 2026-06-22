"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// ============================================
// POST /dossiers (créer un dossier - CLIENT)
// ============================================
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, type } = req.body;
        // req.user!.id = l'ID du client connecté (décodé du JWT)
        const dossier = await prisma.dossier.create({
            data: {
                userId: req.user.id,
                vehicleId,
                type,
                status: 'EN_ATTENTE',
            },
        });
        res.json(dossier);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ============================================
// GET /dossiers/mine (mes dossiers - CLIENT)
// ============================================
router.get('/mine', auth_1.authenticateToken, async (req, res) => {
    try {
        const dossiers = await prisma.dossier.findMany({
            where: { userId: req.user.id },
            include: {
                vehicle: true, // Jointure : on récupère aussi les infos du véhicule
                documents: true, // et les documents uploadés
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(dossiers);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// ============================================
// GET /dossiers/:id (suivi détail - CLIENT ou ADMIN)
// ============================================
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const dossier = await prisma.dossier.findUnique({
            where: { id: req.params.id },
            include: {
                vehicle: true,
                documents: true,
                history: { orderBy: { createdAt: 'asc' } }, // Historique des changements de statut
            },
        });
        if (!dossier)
            return res.status(404).json({ message: 'Dossier introuvable' });
        // Sécurité : on ne peut voir que SON dossier, sauf si on est admin
        if (dossier.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Accès refusé' });
        }
        res.json(dossier);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
//
// DELETE /dossiers/:id (suppression par le propriétaire uniquement)
//
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const dossier = await prisma.dossier.findUnique({
            where: { id: req.params.id },
        });
        if (!dossier)
            return res.status(404).json({ message: 'Dossier introuvable' });
        if (dossier.userId !== req.user.id)
            return res.status(403).json({ message: 'Accès refusé' });
        await prisma.dossier.delete({ where: { id: req.params.id } });
        res.json({ message: 'Dossier supprimé' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
exports.default = router;
