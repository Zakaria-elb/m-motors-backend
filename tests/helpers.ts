import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function createClient() {
  const email = `client-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const res = await request(app).post('/auth/register').send({
    email,
    password: 'Password123',
    firstName: 'Client',
    lastName: 'Test',
  });
  return {
    token: res.body.access_token,
    userId: res.body.user.id,
    email,
  };
}

export async function createAdmin() {
  const email = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const passwordHash = bcrypt.hashSync('AdminPass123!', 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'ADMIN',
    },
  });

  const res = await request(app).post('/auth/login').send({
    email,
    password: 'AdminPass123!',
  });

  return {
    token: res.body.access_token,
    userId: res.body.user.id,
    email,
  };
}

export async function createVehicle(token: string, overrides: any = {}) {
  const res = await request(app)
    .post('/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .field('brand', overrides.brand || 'Renault')
    .field('model', overrides.model || 'Clio')
    .field('year', String(overrides.year || 2021))
    .field('mileage', String(overrides.mileage || 30000))
    .field('price', String(overrides.price || 15000))
    .field('monthlyPrice', String(overrides.monthlyPrice || 250))
    .field('status', overrides.status || 'A_VENDRE')
    .field('type', overrides.type || 'LES_DEUX')
    .field('description', overrides.description || 'Véhicule test');

  return res.body;
}

export async function createDossier(token: string, vehicleId: string, type = 'ACHAT') {
  const res = await request(app)
    .post('/dossiers')
    .set('Authorization', `Bearer ${token}`)
    .send({ vehicleId, type });

  return res.body;
}
