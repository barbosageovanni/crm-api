// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { userServiceBackend } from '../services/userServiceBackend';
import { AppError } from '../middlewares/AppError';
import type { UserFilterParams } from '../dtos/userDtos'; // Importando do arquivo de DTOs do backend

// Helper para lidar com erros de validação
const handleValidationErrors = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Erro de validação', 400, errors.array());
  }
};

export const userController = {
  // GET /users
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extrair parâmetros de query para filtros e paginação
      const { page, limit, nome, email, papel, ativo } = req.query;
      
      // Usando type assertion para garantir compatibilidade com TypeScript estrito
      const params = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        nome: nome as string | undefined,
        email: email as string | undefined,
        papel: papel as any | undefined,
        ativo: ativo === undefined ? undefined : ativo === 'true',
      } as UserFilterParams;

      const result = await userServiceBackend.getUsers(params);
      res.status(200).json(result);
    } catch (error) {
      next(error); // Passa o erro para o middleware global
    }
  },

  // GET /users/:id
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Garantir que id existe antes de usar parseInt
      const idParam = req.params.id;
      if (!idParam) {
        throw new AppError('ID de usuário não fornecido.', 400);
      }
      
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        throw new AppError('ID de usuário inválido.', 400);
      }
      
      const user = await userServiceBackend.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  // POST /users
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    handleValidationErrors(req);
    try {
      const newUser = await userServiceBackend.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  },

  // PUT /users/:id
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    handleValidationErrors(req);
    try {
      // Garantir que id existe antes de usar parseInt
      const idParam = req.params.id;
      if (!idParam) {
        throw new AppError('ID de usuário não fornecido.', 400);
      }
      
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        throw new AppError('ID de usuário inválido.', 400);
      }
      
      const updatedUser = await userServiceBackend.updateUser(id, req.body);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  // DELETE /users/:id
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Garantir que id existe antes de usar parseInt
      const idParam = req.params.id;
      if (!idParam) {
        throw new AppError('ID de usuário não fornecido.', 400);
      }
      
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        throw new AppError('ID de usuário inválido.', 400);
      }
      
      await userServiceBackend.deleteUser(id);
      res.status(204).send(); // No Content
    } catch (error) {
      next(error);
    }
  },
  
  // POST /users/reset-password/:id (ou outra rota conforme necessário)
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    handleValidationErrors(req); // Adicionar validação para novaSenha
    try {
      // Garantir que id existe antes de usar parseInt
      const idParam = req.params.id;
      if (!idParam) {
        throw new AppError('ID de usuário não fornecido.', 400);
      }
      
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        throw new AppError('ID de usuário inválido.', 400);
      }
      
      const { novaSenha } = req.body;
      if (!novaSenha) {
        throw new AppError('Nova senha é obrigatória.', 400);
      }
      
      await userServiceBackend.resetPassword(id, novaSenha);
      res.status(204).send(); // No Content
    } catch (error) {
      next(error);
    }
  },
};
