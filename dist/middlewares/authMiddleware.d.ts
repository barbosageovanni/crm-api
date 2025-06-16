import { Request, Response, NextFunction } from 'express';
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
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map