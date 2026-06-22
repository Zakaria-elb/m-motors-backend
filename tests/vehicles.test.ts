import request from 'supertest';
import app from '../src/app';

async function getClientToken() {
  const res = await request(app).post('/auth/register').send({
    email: `client-${Date.now()}@example.com`,
    password: 'Password123',
    firstName: 'Client',
    lastName: 'Test',
  });
  return res.body.access_token;
}

describe('Vehicles', () => {
  it('GET /vehicles retourne une liste', async () => {
    const res = await request(app).get('/vehicles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /vehicles?type=ACHAT filtre les véhicules achat', async () => {
    const res = await request(app).get('/vehicles?type=ACHAT');
    expect(res.status).toBe(200);
    res.body.forEach((v: any) => {
      expect(['ACHAT', 'LES_DEUX']).toContain(v.type);
    });
  });

  it('GET /vehicles?type=LOCATION filtre les véhicules location', async () => {
    const res = await request(app).get('/vehicles?type=LOCATION');
    expect(res.status).toBe(200);
    res.body.forEach((v: any) => {
      expect(['LOCATION', 'LES_DEUX']).toContain(v.type);
    });
  });

  it('GET /vehicles/:id retourne 404 si introuvable', async () => {
    const res = await request(app).get('/vehicles/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('POST /vehicles crée un véhicule', async () => {
    const token = await getClientToken();

    const res = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'Peugeot')
      .field('model', '3008')
      .field('year', '2022')
      .field('mileage', '20000')
      .field('price', '25000')
      .field('monthlyPrice', '400')
      .field('status', 'A_VENDRE')
      .field('type', 'LES_DEUX')
      .field('description', 'SUV premium');

    expect(res.status).toBe(200);
    expect(res.body.brand).toBe('Peugeot');
    expect(res.body.type).toBe('LES_DEUX');
  });

  it('PATCH /vehicles/:id/bascule change le statut et le type', async () => {
    const token = await getClientToken();

    const create = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'Renault')
      .field('model', 'Clio')
      .field('year', '2021')
      .field('mileage', '30000')
      .field('price', '15000')
      .field('monthlyPrice', '250')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const id = create.body.id;

    const res = await request(app)
      .patch(`/vehicles/${id}/bascule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'EN_LOCATION' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EN_LOCATION');
    expect(res.body.type).toBe('LOCATION');
  });
  it('DELETE /vehicles/:id supprime un véhicule', async () => {
    const token = await getClientToken();
    const created = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'Delete')
      .field('model', 'Test')
      .field('year', '2020')
      .field('mileage', '10000')
      .field('price', '10000')
      .field('monthlyPrice', '200')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const res = await request(app)
      .delete(`/vehicles/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Véhicule supprimé');
  });

  it('GET /vehicles?brand=Renault filtre par marque', async () => {
    const token = await getClientToken();
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'RenaultFilter')
      .field('model', 'Clio')
      .field('year', '2021')
      .field('mileage', '20000')
      .field('price', '15000')
      .field('monthlyPrice', '250')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const res = await request(app).get('/vehicles?brand=RenaultFilter');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].brand).toBe('RenaultFilter');
  });

  it('GET /vehicles?minPrice=10000&maxPrice=20000 filtre par prix', async () => {
    const res = await request(app).get('/vehicles?minPrice=10000&maxPrice=20000');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /vehicles retourne 400 si minPrice > maxPrice', async () => {
    const res = await request(app).get('/vehicles?minPrice=50000&maxPrice=10000');
    expect(res.status).toBe(400);
  });
  it('GET /vehicles?model=Clio filtre par modèle', async () => {
    const token = await getClientToken();
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'Renault')
      .field('model', 'ClioModelFilter')
      .field('year', '2021')
      .field('mileage', '20000')
      .field('price', '15000')
      .field('monthlyPrice', '250')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const res = await request(app).get('/vehicles?model=ClioModelFilter');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /vehicles?maxMileage=25000 filtre par kilométrage', async () => {
    const res = await request(app).get('/vehicles?maxMileage=25000');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /vehicles/:id/bascule vers LES_DEUX', async () => {
    const token = await getClientToken();
    const created = await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'Peugeot')
      .field('model', '3008')
      .field('year', '2022')
      .field('mileage', '20000')
      .field('price', '25000')
      .field('monthlyPrice', '400')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const res = await request(app)
      .patch(`/vehicles/${created.body.id}/bascule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'LES_DEUX' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('LES_DEUX');
    expect(res.body.type).toBe('LES_DEUX');
  });
  it('GET /vehicles retourne 400 si prix min > max', async () => {
    const res = await request(app).get('/vehicles?minPrice=50000&maxPrice=10000');
    expect(res.status).toBe(400);
  });

  it('GET /vehicles retourne 500 en cas d erreur Prisma simulée', async () => {
    // On ne peut pas simuler facilement, mais on teste la route avec un type invalide
    const res = await request(app).get('/vehicles?status=INVALID_STATUS');
    expect(res.status).toBe(500);
  });
  it('GET /vehicles?status=A_VENDRE filtre par statut', async () => {
    const token = await getClientToken();
    await request(app)
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .field('brand', 'StatusFilter')
      .field('model', 'Test')
      .field('year', '2021')
      .field('mileage', '20000')
      .field('price', '15000')
      .field('monthlyPrice', '250')
      .field('status', 'A_VENDRE')
      .field('type', 'ACHAT');

    const res = await request(app).get('/vehicles?status=A_VENDRE');
    expect(res.status).toBe(200);
    expect(res.body.every((v: any) => v.status === 'A_VENDRE')).toBe(true);
  });

  it('GET /vehicles retourne 400 si prix négatif', async () => {
    const res = await request(app).get('/vehicles?minPrice=-100');
    expect(res.status).toBe(400);
  });

  it('PATCH /vehicles/:id/bascule retourne 500 si ID invalide', async () => {
    const token = await getClientToken();
    const res = await request(app)
      .patch('/vehicles/not-a-uuid/bascule')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'EN_LOCATION' });
    expect(res.status).toBe(500);
  });

  it('DELETE /vehicles/:id retourne 500 si ID invalide', async () => {
    const token = await getClientToken();
    const res = await request(app)
      .delete('/vehicles/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
  });

});
