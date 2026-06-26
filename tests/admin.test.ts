import request from 'supertest';
import app from '../src/app';
import { createClient, createAdmin, createVehicle, createDossier } from './helpers';
import path from 'path';
import fs from 'fs';

describe('Admin', () => {
  it('GET /admin/dossiers ', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/admin/dossiers')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /admin/dossiers refuser ', async () => {
    const client = await createClient();
    const res = await request(app)
      .get('/admin/dossiers')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(403);
  });
   it('GET /admin/dossiers retourne les dossiers avec documents et user', async () => {
  const admin = await createAdmin();
  const client = await createClient();
  const vehicle = await createVehicle(client.token);
  const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

  // Upload un document
  const tempPdfPath = path.join(__dirname, 'test-file.pdf');
  fs.writeFileSync(tempPdfPath, '%PDF-1.4 test pdf content');
  await request(app)
    .post('/documents')
    .set('Authorization', `Bearer ${client.token}`)
    .field('dossierId', dossier.id)
    .attach('file', tempPdfPath, { filename: 'test.pdf', contentType: 'application/pdf' });
  fs.unlinkSync(tempPdfPath);

  const res = await request(app)
    .get('/admin/dossiers')
    .set('Authorization', `Bearer ${admin.token}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThanOrEqual(1);

  const found = res.body.find((d: any) => d.id === dossier.id);
  expect(found).toBeDefined();
  expect(found.documents).toBeDefined();
  expect(found.documents.length).toBe(1);
  expect(found.documents[0].originalName).toBe('test.pdf');
});

  it('GET /admin/dossiers refuse  token', async () => {
    const res = await request(app).get('/admin/dossiers');
    expect(res.status).toBe(401);
  });

  it('PATCH /admin/dossiers/:id/status valide ', async () => {
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

  it('PATCH /admin/dossiers/:id/status valide un dossier ', async () => {
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

  it('PATCH /admin/dossiers/:id/status accepte ', async () => {
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
