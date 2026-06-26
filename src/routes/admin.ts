import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /admin/dossiers — tous les dossiers avec véhicule, client, documents et historique
router.get('/dossiers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const dossiers = await prisma.dossier.findMany({
      include: {
        vehicle: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        documents: true, // ← INDISPENSABLE
        history: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dossiers);
  } catch (error) {
    console.error('Erreur GET /admin/dossiers:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /admin/dossiers/:id/status — changement de statut + historique
router.patch('/dossiers/:id/status', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment } = req.body;

    const existing = await prisma.dossier.findUnique({
      where: { id: req.params.id as string },
    });
    if (!existing) return res.status(404).json({ message: 'Dossier introuvable' });

    const dossier = await prisma.dossier.update({
      where: { id: req.params.id as string },
      data: {
        status,
        adminComment: comment || undefined,
      },
      include: { vehicle: true, user: true, documents: true },
    });

    await prisma.dossierHistory.create({
      data: {
        dossierId: dossier.id,
        oldStatus: existing.status,
        newStatus: status,
        changedBy: req.user!.id,
        comment: comment || undefined,
      },
    });

    console.log(`[NOTIFICATION EMAIL] À: ${dossier.user.email} | Dossier ${dossier.id} passé de ${existing.status} → ${status} | Commentaire: ${comment || 'Aucun'}`);

    res.json(dossier);
  } catch (error) {
    console.error('Erreur PATCH /admin/dossiers/:id/status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
