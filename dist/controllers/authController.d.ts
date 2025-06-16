import { Request, Response, NextFunction } from 'express';
/**
 * Lida com o registro de um novo usuário.
 */
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Lida com o login de um usuário existente.
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map