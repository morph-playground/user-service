import { Request } from 'express';

export class IdentityProvider {
  getUserId(req: Request): string | null {
    console.log('Extracting user ID from request');
    const userId = req.header('identity-user-id');
    console.log(`User ID: ${userId}`);
    return userId || null;
  }
}