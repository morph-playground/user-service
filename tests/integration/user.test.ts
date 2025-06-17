import request from 'supertest';
import express from 'express';
import nock from 'nock';
import { createApp } from '../../src/app';

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
    it('should create a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: userData.name,
        email: userData.email
      });
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });

    it('should return 400 when name is missing', async () => {
      const userData = {
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    it('should return 400 when email is missing', async () => {
      const userData = {
        name: 'John Doe'
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });
  });

  describe('GET /users/me', () => {
    it('should get user details when user has permission', async () => {
      // First create a user
      const userData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      };

      const createResponse = await request(app)
        .post('/users')
        .send(userData);

      const userId = createResponse.body.id;

      // Mock permission service to allow access
      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: userId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: true });

      const response = await request(app)
        .get('/users/me')
        .set('identity-user-id', userId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: userId,
        name: userData.name,
        email: userData.email
      });
    });

    it('should return 401 when user ID is not provided', async () => {
      const response = await request(app)
        .get('/users/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User ID not provided');
    });

    it('should return 403 when user does not have permission', async () => {
      const userId = 'test-user-id';

      // Mock permission service to deny access
      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: userId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: false });

      const response = await request(app)
        .get('/users/me')
        .set('identity-user-id', userId);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should return 404 when user does not exist', async () => {
      const userId = 'non-existent-user-id';

      // Mock permission service to allow access
      nock(permissionServiceBaseUrl)
        .get('/permissions/check')
        .query({
          subjectId: userId,
          domain: 'USER',
          action: 'LIST'
        })
        .reply(200, { allowed: true });

      const response = await request(app)
        .get('/users/me')
        .set('identity-user-id', userId);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });
});