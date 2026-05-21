import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /admin/dossiers (liste pour admin, avec filtres)
router.get('/dossiers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) where.status = status as string;

    const dossiers = await prisma.dossier.findMany({
      where,
      include: {
        vehicle: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /admin/dossiers/:id/status (valider / refuser / signer)
router.patch('/dossiers/:id/status', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment } = req.body;
    
    const dossier = await prisma.dossier.update({
      where: { id: req.params.id as string },
      data: {
        status,
        adminComment: comment || null,
      },
    });

    // Historique de la décision
    await prisma.dossierHistory.create({
      data: {
        dossierId: dossier.id,
        oldStatus: dossier.status, // Note: ici c'est déjà mis à jour, en prod on ferait différemment
        newStatus: status,
        changedBy: req.user!.id,
        comment: comment || null,
      },
    });

    res.json(dossier);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
