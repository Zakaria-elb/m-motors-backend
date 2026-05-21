import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /vehicles (liste avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const where: any = {};
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /vehicles/:id (détail d'un véhicule)
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
    });
    
    if (!vehicle) return res.status(404).json({ message: 'Véhicule introuvable' });
    
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /vehicles (création - admin)
router.post('/', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: req.body,
    });
    res.json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  } 
});

// DELETE /vehicles/:id (suppression - admin)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Véhicule supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /vehicles/:id/bascule (changement de statut - admin)
router.patch('/:id/bascule', async (req, res) => {
  try {
    const { status } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
