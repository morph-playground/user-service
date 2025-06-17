import { Request, Response } from 'express';

export class HealthController {
  getHealth(req: Request, res: Response): void {
    console.log('Received a request to get health status');
    res.status(200).json({ status: "OK" });
  }
}