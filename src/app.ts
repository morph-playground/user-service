import express from 'express';
import { HealthController } from './controllers/health.controller';
import { UserController } from './controllers/user.controller';
import { IdentityProvider } from './middleware/identity.provider';
import { PermissionServiceClient } from './clients/permission-service.client';
import { UserService } from './services/user.service';

export function createApp(permissionServiceConfig: { host: string; port: number }) {
  const app = express();
  app.use(express.json());

  console.log('Initializing dependencies...');
  const identityProvider = new IdentityProvider();
  const permissionServiceClient = new PermissionServiceClient(permissionServiceConfig);
  const userService = new UserService();
  console.log('Dependencies initialized.');

  const healthController = new HealthController();
  const userController = new UserController(identityProvider, userService, permissionServiceClient);

  app.get('/health', (req, res) => {
    console.log('Received /health request.');
    healthController.getHealth(req, res);
  });
  app.post('/users', (req, res) => {
    console.log('Received /users POST request.');
    userController.createUser(req, res);
  });
  app.get('/users/me', (req, res) => {
    console.log('Received /users/me GET request.');
    userController.getUser(req, res);
  });

  return app;
}