import { Request, Response } from 'express';
import { IdentityProvider } from '../middleware/identity.provider';
import { UserService } from '../services/user.service';
import { PermissionServiceClient, Domain, Action } from '../clients/permission-service.client';

export class UserController {
  constructor(
    private identityProvider: IdentityProvider,
    private userService: UserService,
    private permissionServiceClient: PermissionServiceClient
  ) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        res.status(400).json({ error: 'Name and email are required' });
        return;
      }

      const user = this.userService.createUser(name, email);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.identityProvider.getUserId(req);
      
      if (!userId) {
        res.status(401).json({ error: 'User ID not provided' });
        return;
      }

      const hasPermission = await this.permissionServiceClient.hasPermission(
        userId,
        Domain.USER,
        Action.LIST
      );

      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const user = this.userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}