import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import nock from 'nock';

const permissionServiceHost = 'localhost';
const permissionServicePort = 3001;
const permissionServiceBaseUrl = `http://${permissionServiceHost}:${permissionServicePort}`;

describe('User Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp({ host: permissionServiceHost, port: permissionServicePort });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /users', () => {
    it('should create a user and return user object with generated id', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', email: 'test@example.com' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 400 if name or email missing', async () => {
      const resp1 = await request(app).post('/users').send({ email: 'test@example.com' });
      expect(resp1.status).toBe(400);

      const resp2 = await request(app).post('/users').send({ name: 'Test User' });
      expect(resp2.status).toBe(400);
    });
  });

  describe('GET /users/me', () => {
    it('should return 401 when header missing', async () => {
      const response = await request(app).get('/users/me');
      expect(response.status).toBe(401);
    });

    it('should return user details when correct header and user exists and has permission', async () => {
      // Create a user first
      const createResp = await request(app)
        .post('/users')
        .send({ name: 'Fit User', email: 'fit@example.com' });

      const userId = createResp.body.id;
      expect(userId).toBeDefined();

      // Mock Permission Service: allow LIST for user
      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: userId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: true });

      const getResp = await request(app)
        .get('/users/me')
        .set('identity-user-id', userId);

      expect(getResp.status).toBe(200);
      expect(getResp.body).toEqual({
        id: userId,
        name: 'Fit User',
        email: 'fit@example.com'
      });
    });

    it('should 404 if user not found (but has permission)', async () => {
      const fakeId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: fakeId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: true });

      const response = await request(app)
        .get('/users/me')
        .set('identity-user-id', fakeId);

      expect(response.status).toBe(404);
    });

    it('should 403 if permission denied', async () => {
      const createResp = await request(app)
        .post('/users')
        .send({ name: 'Deny User', email: 'deny@example.com' });

      const userId = createResp.body.id;

      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: userId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: false });

      const resp = await request(app)
        .get('/users/me')
        .set('identity-user-id', userId);

      expect(resp.status).toBe(403);
    });
  });
});