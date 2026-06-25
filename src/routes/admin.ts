import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /admin/dossiers
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


// PATCH /admin/dossiers/status 
router.patch('/dossiers/:id/status', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment } = req.body;

    // Récupérer  statut 
    const oldDossier = await prisma.dossier.findUnique({
      where: { id: req.params.id as string },
      include: { user: { select: { email: true, firstName: true, lastName: true } }, vehicle: true }
    });

    if (!oldDossier) return res.status(404).json({ message: 'Dossier introuvable' });

    const oldStatus = oldDossier.status;
    const newStatus = status as string;

    // Màj  du dossier
    const updated = await prisma.dossier.update({
      where: { id: req.params.id as string },
      data: {
        status: newStatus as any,
        adminComment: comment || null,
      },
    });

    // Historiquede 
    await prisma.dossierHistory.create({
      data: {
        dossierId: updated.id,
        oldStatus: oldStatus,
        newStatus: newStatus as any,
        changedBy: req.user!.id,
        comment: comment || null,
      },
    });

    // Simulation envoi notification 
    console.log(`📧 [NOTIFICATION EMAIL] À: ${oldDossier.user.email} | Dossier ${updated.id} passé de ${oldStatus} → ${newStatus} | Commentaire: ${comment || 'Aucun'}`);

    // Retourner le dossier 
    res.json({
      ...updated,
      vehicle: oldDossier.vehicle,
      user: oldDossier.user,
    });
  } catch (error) {
    console.error('❌ ERREUR PATCH admin/dossiers/:id/status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


export default router;
