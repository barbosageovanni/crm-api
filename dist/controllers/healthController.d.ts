import { Request, Response, NextFunction } from 'express';
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export declare const metrics: (req: Request, res: Response) => Promise<void>;
export declare const alertMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=healthController.d.ts.map