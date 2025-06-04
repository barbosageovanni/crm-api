// src/types/express.d.ts
import { PapelUsuario } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        papel: PapelUsuario;
      };
    }
  }
}

export {};