import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// POST /dossiers (créer un dossier - CLIENT)
// ============================================
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { vehicleId, type } = req.body;
    
    // req.user!.id = l'ID du client connecté (décodé du JWT)
    const dossier = await prisma.dossier.create({
      data: {
        userId: req.user!.id,
        vehicleId,
        type,
        status: 'EN_ATTENTE',
      },
    });
    
    res.json(dossier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================
// GET /dossiers/mine (mes dossiers - CLIENT)
// ============================================
router.get('/mine', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const dossiers = await prisma.dossier.findMany({
      where: { userId: req.user!.id },
      include: { 
        vehicle: true,      // Jointure : on récupère aussi les infos du véhicule
        documents: true,    // et les documents uploadés
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================
// GET /dossiers/:id (suivi détail - CLIENT ou ADMIN)
// ============================================
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id as string },
      include: { 
        vehicle: true, 
        documents: true,
        history: { orderBy: { createdAt: 'asc' } }, // Historique des changements de statut
      },
    });
    
    if (!dossier) return res.status(404).json({ message: 'Dossier introuvable' });
    
    // Sécurité : on ne peut voir que SON dossier, sauf si on est admin
    if (dossier.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    res.json(dossier);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /dossiers
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id as string },
    });

    if (!dossier) return res.status(404).json({ message: 'Dossier introuvable' });
    if (dossier.userId !== req.user!.id) return res.status(403).json({ message: 'Accès refusé' });

    await prisma.dossier.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Dossier supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


export default router;

