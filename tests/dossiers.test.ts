import request from 'supertest';
import app from '../src/app';
import { createAdmin, createClient, createVehicle, createDossier } from './helpers';

describe('Dossiers', () => {
  it('GET /dossiers/mine refuse sans token', async () => {
    const res = await request(app).get('/dossiers/mine');
    expect(res.status).toBe(401);
  });

  it('POST /dossiers crée un dossier client', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const res = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: vehicle.id, type: 'ACHAT' });

    expect(res.status).toBe(200);
    expect(res.body.vehicleId).toBe(vehicle.id);
    expect(res.body.status).toBe('EN_ATTENTE');
  });

  it('GET /dossiers/mine retourne les dossiers du client', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .get('/dossiers/mine')
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /dossiers/:id retourne le détail du dossier', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .get(`/dossiers/${dossier.id}`)
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(dossier.id);
  });

  it('GET /dossiers/:id permet à un admin de voir le dossier', async () => {
    const admin = await createAdmin();
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .get(`/dossiers/${dossier.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(dossier.id);
  });

  it('GET /dossiers/:id refuse un dossier d un autre client', async () => {
    const client1 = await createClient();
    const client2 = await createClient();
    const vehicle1 = await createVehicle(client1.token);
    const dossier = await createDossier(client1.token, vehicle1.id, 'ACHAT');

    const res = await request(app)
      .get(`/dossiers/${dossier.id}`)
      .set('Authorization', `Bearer ${client2.token}`);

    expect(res.status).toBe(403);
  });

  it('GET /dossiers/:id retourne 404 si introuvable', async () => {
    const client = await createClient();
    const res = await request(app)
      .get('/dossiers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /dossiers/:id supprime le dossier du propriétaire', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .delete(`/dossiers/${dossier.id}`)
      .set('Authorization', `Bearer ${client.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Dossier supprimé');
  });

  it('DELETE /dossiers/:id refuse un dossier d un autre client', async () => {
    const client1 = await createClient();
    const client2 = await createClient();
    const vehicle1 = await createVehicle(client1.token);
    const dossier = await createDossier(client1.token, vehicle1.id, 'ACHAT');

    const res = await request(app)
      .delete(`/dossiers/${dossier.id}`)
      .set('Authorization', `Bearer ${client2.token}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /dossiers/:id retourne 404 si introuvable', async () => {
    const client = await createClient();
    const res = await request(app)
      .delete('/dossiers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(404);
  });

  it('POST /dossiers retourne 500 avec données invalides', async () => {
    const client = await createClient();
    const res = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ vehicleId: 'not-a-uuid', type: 'INVALID_TYPE' });
    expect(res.status).toBe(500);
  });
});
