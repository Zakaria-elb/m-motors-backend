import request from 'supertest';
import app from '../src/app';

describe('Auth', () => {
  it('POST /auth/register crée un compte client', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'client.test@example.com',
      password: 'Password123',
      firstName: 'Jean',
      lastName: 'Test',
    });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('CLIENT');
  });

  it('POST /auth/register refuse un email qui existe deja', async () => {
    await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Password123',
      firstName: 'A',
      lastName: 'B',
    });

    const res = await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Password123',
      firstName: 'C',
      lastName: 'D',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email déjà utilisé');
  });

  it('POST /auth/login connecte un utilisateur', async () => {
    await request(app).post('/auth/register').send({
      email: 'login@example.com',
      password: 'Password123',
      firstName: 'Login',
      lastName: 'Test',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'Password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('POST /auth/login refuse un mauvais mot de passe', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(400);
  });

  it('GET /auth/me refuse sans token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /auth/me retourne le profil avec un token valide', async () => {
    const register = await request(app).post('/auth/register').send({
      email: 'me@example.com',
      password: 'Password123',
      firstName: 'Me',
      lastName: 'Test',
    });

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${register.body.access_token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });
  it('POST /auth/login refuse un email inexistant', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'inexistant@example.com',
      password: 'Password123',
    });
    expect(res.status).toBe(400);
  });
  it('POST /auth/register retourne 500 si mdp manquant', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'nopassword@example.com',
      firstName: 'No',
      lastName: 'Password',
    });
    expect(res.status).toBe(500);
  });

  it('POST /auth/login retourne 500 si email manquant', async () => {
    const res = await request(app).post('/auth/login').send({
      password: 'Password123',
    });
    expect(res.status).toBe(500);
  });


});
