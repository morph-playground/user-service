import express from 'express';
import { HealthController } from './controllers/health.controller';
import { IdentityProvider } from './middleware/identity.provider';
import { PermissionServiceClient } from './clients/permission-service.client';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

export function createApp(permissionServiceConfig: { host: string; port: number }) {
  const app = express();
  app.use(express.json());

  const identityProvider = new IdentityProvider();
  const permissionServiceClient = new PermissionServiceClient(permissionServiceConfig);

  const healthController = new HealthController();

  // User related instances
  const userService = new UserService();
  const userController = new UserController(userService, identityProvider, permissionServiceClient);

  app.get('/health', (req, res) => healthController.getHealth(req, res));

  app.post('/users', (req, res) => userController.createUser(req, res));
  app.get('/users/me', (req, res) => userController.getMe(req, res));

  return app;
}