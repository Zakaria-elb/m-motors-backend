import request from 'supertest';
import app from '../src/app';
import { createAdmin, createClient } from './helpers';

describe('Middleware', () => {
  it('requireRole refuse un client sur une route admin', async () => {
    const client = await createClient();
    const res = await request(app)
      .get('/admin/dossiers')
      .set('Authorization', `Bearer ${client.token}`);
    expect(res.status).toBe(403);
  });

  it('authenticateToken refuse un token malformé', async () => {
    const res = await request(app)
      .get('/dossiers/mine')
      .set('Authorization', 'Bearer invalid-token-123');
    expect(res.status).toBe(403);
  });

  it('authenticateToken refuse un header sans Bearer', async () => {
    const res = await request(app)
      .get('/dossiers/mine')
      .set('Authorization', 'invalid-token');
    expect(res.status).toBe(401);
  });
});
