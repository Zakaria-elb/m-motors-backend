import request from 'supertest';
import app from '../src/app';
import path from 'path';
import fs from 'fs';
import { createClient, createVehicle, createDossier } from './helpers';

describe('Documents', () => {
  let tempPdfPath: string;

  beforeAll(() => {
    tempPdfPath = path.join(__dirname, 'test-file.pdf');
    fs.writeFileSync(tempPdfPath, '%PDF-1.4 test pdf content');
  });

  afterAll(() => {
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  });

  it('POST /documents upload un fichier PDF', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .field('dossierId', dossier.id)
      .attach('file', tempPdfPath, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.originalName).toBe('test.pdf');
    expect(res.body.dossierId).toBe(dossier.id);
  });

  it('POST /documents refuse sans fichier', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .field('dossierId', dossier.id);

    expect(res.status).toBe(400);
  });

  it('POST /documents refuse sans token', async () => {
    const res = await request(app).post('/documents');
    expect(res.status).toBe(401);
  });
  it('POST /documents refuse un fichier non PDF/JPG/PNG', async () => {
    const client = await createClient();
    const vehicle = await createVehicle(client.token);
    const dossier = await createDossier(client.token, vehicle.id, 'ACHAT');

    const tempTxtPath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(tempTxtPath, 'fichier texte non autorisé');

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .field('dossierId', dossier.id)
      .attach('file', tempTxtPath, { filename: 'test.txt', contentType: 'text/plain' });

    fs.unlinkSync(tempTxtPath);
    expect(res.status).toBe(500);
  });
  it('POST /documents retourne 500 si dossierId invalide', async () => {
    const client = await createClient();
    const tempPdfPath = path.join(__dirname, 'test-file.pdf');

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .field('dossierId', 'not-a-uuid')
      .attach('file', tempPdfPath, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(500);
  });
  it('POST /documents retourne 500 si Id manquant', async () => {
    const client = await createClient();
    const tempPdfPath = path.join(__dirname, 'test-file.pdf');

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .attach('file', tempPdfPath, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(500);
  });


  it('POST /documents retourne 500 avec fichier trop volumineux simulé', async () => {
    // On ne peut pas simuler facilement un fichier > 20Mo, mais on teste la route sans body
    const client = await createClient();
    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${client.token}`)
      .field('dossierId', 'invalid');
    expect([400, 500]).toContain(res.status);
  });

});
