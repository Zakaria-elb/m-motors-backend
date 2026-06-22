import request from 'supertest';
import app from '../src/app';
import { createClient, createAdmin, createVehicle } from './helpers';

describe('Appointments', () => {
  it('POST /appointments crée un rendez-vous client', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTime = tomorrow.toISOString().split('T')[0] + 'T10:00:00';

    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, dateTime });

    expect(res.status).toBe(200);
    expect(res.body.vehicleId).toBe(vehicle.id);
    expect(res.body.status).toBe('EN_ATTENTE');
  });

  it('POST /appointments refuse sans date', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);

    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id });

    expect(res.status).toBe(400);
  });

  it('GET /appointments/mine retourne les rdv du client', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTime = tomorrow.toISOString().split('T')[0] + 'T10:00:00';

    await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, dateTime });

    const res = await request(app)
      .get('/appointments/mine')
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /appointments/admin retourne tous les rdv (admin)', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/appointments/admin')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /appointments/admin/:id/status confirme un rdv', async () => {
    const admin = await createAdmin();
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTime = tomorrow.toISOString().split('T')[0] + 'T11:00:00';

    const created = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, dateTime });

    const res = await request(app)
      .patch(`/appointments/admin/${created.body.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'CONFIRME' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRME');
  });
  it('POST /appointments refuse un créneau déjà réservé', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTime = tomorrow.toISOString().split('T')[0] + 'T10:00:00';

    await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, dateTime });

    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, dateTime });

    expect(res.status).toBe(400);
  });
  it('POST /appointments refuse un véhicule inexistant', async () => {
    const client = await createClient();
    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: '00000000-0000-0000-0000-000000000000', dateTime: '2026-12-31T10:00:00' });
    expect(res.status).toBe(404);
  });

  it('PATCH /appointments/admin/:id/status retourne 404 si rdv inexistant', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .patch('/appointments/admin/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'CONFIRME' });
    expect(res.status).toBe(500);
  });

});
