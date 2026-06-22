"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /admin/dossiers (liste pour admin, avec filtres)
router.get('/dossiers', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status)
            where.status = status;
        const dossiers = await prisma.dossier.findMany({
            where,
            include: {
                vehicle: true,
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(dossiers);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// PATCH /admin/dossiers/:id/status (valider / refuser / signer)
// PATCH /admin/dossiers/:id/status (valider / refuser / signer)
router.patch('/dossiers/:id/status', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { status, comment } = req.body;
        // 1. Récupérer l'ancien statut AVANT modification
        const oldDossier = await prisma.dossier.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { email: true, firstName: true, lastName: true } }, vehicle: true }
        });
        if (!oldDossier)
            return res.status(404).json({ message: 'Dossier introuvable' });
        const oldStatus = oldDossier.status;
        const newStatus = status;
        // 2. Mise à jour du dossier
        const updated = await prisma.dossier.update({
            where: { id: req.params.id },
            data: {
                status: newStatus,
                adminComment: comment || null,
            },
        });
        // 3. Historique de la décision
        await prisma.dossierHistory.create({
            data: {
                dossierId: updated.id,
                oldStatus: oldStatus,
                newStatus: newStatus,
                changedBy: req.user.id,
                comment: comment || null,
            },
        });
        // 4. Simulation envoi notification email (visible console + logique métier)
        console.log(`📧 [NOTIFICATION EMAIL] À: ${oldDossier.user.email} | Dossier ${updated.id} passé de ${oldStatus} → ${newStatus} | Commentaire: ${comment || 'Aucun'}`);
        // 5. Retourner le dossier enrichi pour le frontend admin
        res.json({
            ...updated,
            vehicle: oldDossier.vehicle,
            user: oldDossier.user,
        });
    }
    catch (error) {
        console.error('❌ ERREUR PATCH admin/dossiers/:id/status:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
exports.default = router;
