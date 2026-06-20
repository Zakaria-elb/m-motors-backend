import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /appointments (client réserve un essai)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { vehicleId, dateTime } = req.body;

    if (!dateTime) return res.status(400).json({ message: 'Date et heure obligatoires' });

    // Vérifier que le véhicule existe
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ message: 'Véhicule introuvable' });

    // Vérifier pas de doublon exact même jour/heure même véhicule
    const existing = await prisma.appointment.findFirst({
      where: { vehicleId, dateTime: new Date(dateTime) },
    });
    if (existing) {
      return res.status(400).json({ message: 'Ce créneau est déjà réservé pour ce véhicule' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        vehicleId,
        dateTime: new Date(dateTime),
        status: 'EN_ATTENTE',
      },
      include: { vehicle: true },
    });

    res.json(appointment);
  } catch (error: any) {
    console.error('❌ POST /appointments:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /appointments/mine (mes rendez-vous client)
router.get('/mine', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user!.id },
      include: { vehicle: true },
      orderBy: { dateTime: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /admin/appointments (admin voit tous les rdv)
router.get('/admin', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { vehicle: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { dateTime: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /admin/appointments/:id/status (confirmer / annuler)
router.patch('/admin/:id/status', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment } = req.body;

    const updated = await prisma.appointment.update({
      where: { id: req.params.id as string },
      data: { status, comment: comment || undefined },
      include: { vehicle: true, user: true },
    });

    console.log(`📧 [NOTIFICATION RDV] À: ${updated.user.email} | RDV ${updated.id} → ${status}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
