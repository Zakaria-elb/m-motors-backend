import request from 'supertest';
import app from '../src/app';
import { createClient, createAdmin, createVehicle, createDossier } from './helpers';

describe('Admin', () => {
  it('GET /admin/dossiers retourne tous les dossiers (admin)', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/admin/dossiers')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /admin/dossiers refuse un client', async () => {
    const client = await createClient();
    const res = await request(app)
      .get('/admin/dossiers')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(403);
  });

  it('GET /admin/dossiers refuse sans token', async () => {
    const res = await request(app).get('/admin/dossiers');
    expect(res.status).toBe(401);
  });

  it('PATCH /admin/dossiers/:id/status valide un dossier EN_REVISION', async () => {
    const admin = await createAdmin();
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'EN_REVISION' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EN_REVISION');
  });

  it('PATCH /admin/dossiers/:id/status refuse un client', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ status: 'EN_REVISION' });

    expect(res.status).toBe(403);
  });

  it('PATCH /admin/dossiers/:id/status valide un dossier VALIDE puis SIGNE', async () => {
    const admin = await createAdmin();
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'EN_REVISION' });

    const valide = await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'VALIDE' });

    expect(valide.status).toBe(200);
    expect(valide.body.status).toBe('VALIDE');

    const signe = await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'SIGNE' });

    expect(signe.status).toBe(200);
    expect(signe.body.status).toBe('SIGNE');
  });

  it('PATCH /admin/dossiers/:id/status accepte n importe quel statut valide de l enum', async () => {
    const admin = await createAdmin();
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .patch(`/admin/dossiers/${dossier.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'BROUILLON' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('BROUILLON');
  });

  it('PATCH /admin/dossiers/:id/status retourne 404 pour dossier inexistant', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .patch('/admin/dossiers/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'EN_REVISION' });
    expect(res.status).toBe(404);
  });

});
