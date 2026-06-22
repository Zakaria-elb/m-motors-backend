import request from 'supertest';
import app from '../src/app';

async function createClientAndVehicle() {
  const client = await request(app).post('/auth/register').send({
    email: `client-${Date.now()}@example.com`,
    password: 'Password123',
    firstName: 'Client',
    lastName: 'Test',
  });

  const vehicle = await request(app)
    .post('/vehicles')
    .set('Authorization', `Bearer ${client.body.access_token}`)
    .field('brand', 'BMW')
    .field('model', 'Serie 1')
    .field('year', '2020')
    .field('mileage', '40000')
    .field('price', '22000')
    .field('monthlyPrice', '350')
    .field('status', 'A_VENDRE')
    .field('type', 'LES_DEUX');

  return { token: client.body.access_token, vehicleId: vehicle.body.id };
}

describe('Dossiers', () => {
  it('GET /dossiers/mine refuse sans token', async () => {
    const res = await request(app).get('/dossiers/mine');
    expect(res.status).toBe(401);
  });

  it('POST /dossiers crée un dossier client', async () => {
    const { token, vehicleId } = await createClientAndVehicle();

    const res = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId, type: 'ACHAT' });

    expect(res.status).toBe(200);
    expect(res.body.vehicleId).toBe(vehicleId);
    expect(res.body.status).toBe('EN_ATTENTE');
  });

  it('GET /dossiers/mine retourne les dossiers du client', async () => {
    const { token, vehicleId } = await createClientAndVehicle();

    await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId, type: 'ACHAT' });

    const res = await request(app)
      .get('/dossiers/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /dossiers/:id retourne le détail du dossier', async () => {
    const { token, vehicleId } = await createClientAndVehicle();

    const created = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId, type: 'ACHAT' });

    const res = await request(app)
      .get(`/dossiers/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('DELETE /dossiers/:id supprime le dossier du propriétaire', async () => {
    const { token, vehicleId } = await createClientAndVehicle();

    const created = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId, type: 'ACHAT' });

    const res = await request(app)
      .delete(`/dossiers/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Dossier supprimé');
  });
  it('GET /dossiers/:id refuse un dossier d un autre client', async () => {
    const client1 = await createClientAndVehicle();
    const client2 = await createClientAndVehicle();

    const created = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${client1.token}`)
      .send({ vehicleId: client1.vehicleId, type: 'ACHAT' });

    const res = await request(app)
      .get(`/dossiers/${created.body.id}`)
      .set('Authorization', `Bearer ${client2.token}`);

    expect(res.status).toBe(403);
  });

  it('GET /dossiers/:id retourne 404 si introuvable', async () => {
    const { token } = await createClientAndVehicle();
    const res = await request(app)
      .get('/dossiers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
  it('DELETE /dossiers/:id refuse un dossier d un autre client', async () => {
    const client1 = await createClientAndVehicle();
    const client2 = await createClientAndVehicle();

    const created = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${client1.token}`)
      .send({ vehicleId: client1.vehicleId, type: 'ACHAT' });

    const res = await request(app)
      .delete(`/dossiers/${created.body.id}`)
      .set('Authorization', `Bearer ${client2.token}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /dossiers/:id retourne 404 si introuvable', async () => {
    const { token } = await createClientAndVehicle();
    const res = await request(app)
      .delete('/dossiers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('POST /dossiers retourne 500 avec données invalides', async () => {
    const { token } = await createClientAndVehicle();
    const res = await request(app)
      .post('/dossiers')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: 'not-a-uuid', type: 'INVALID_TYPE' });
    expect(res.status).toBe(500);
  });

});
