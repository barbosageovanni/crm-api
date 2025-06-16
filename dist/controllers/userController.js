"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const express_validator_1 = require("express-validator");
const userServiceBackend_1 = require("../services/userServiceBackend");
const AppError_1 = require("../errors/AppError");
// Helper para lidar com erros de validação
const handleValidationErrors = (req) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new AppError_1.AppError('Erro de validação', 400, errors.array());
    }
};
exports.userController = {
    // GET /users
    async getUsers(req, res, next) {
        try {
            // Extrair parâmetros de query para filtros e paginação
            const { page, limit, nome, email, papel, ativo } = req.query;
            // Usando type assertion para garantir compatibilidade com TypeScript estrito
            const params = {
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10,
                nome: nome,
                email: email,
                papel: papel,
                ativo: ativo === undefined ? undefined : ativo === 'true',
            };
            const result = await userServiceBackend_1.userServiceBackend.getUsers(params);
            res.status(200).json(result);
        }
        catch (error) {
            next(error); // Passa o erro para o middleware global
        }
    },
    // GET /users/:id
    async getUserById(req, res, next) {
        try {
            // Garantir que id existe antes de usar parseInt
            const idParam = req.params.id;
            if (!idParam) {
                throw new AppError_1.AppError('ID de usuário não fornecido.', 400);
            }
            const id = parseInt(idParam, 10);
            if (isNaN(id)) {
                throw new AppError_1.AppError('ID de usuário inválido.', 400);
            }
            const user = await userServiceBackend_1.userServiceBackend.getUserById(id);
            res.status(200).json(user);
        }
        catch (error) {
            next(error);
        }
    },
    // POST /users
    async createUser(req, res, next) {
        handleValidationErrors(req);
        try {
            const newUser = await userServiceBackend_1.userServiceBackend.createUser(req.body);
            res.status(201).json(newUser);
        }
        catch (error) {
            next(error);
        }
    },
    // PUT /users/:id
    async updateUser(req, res, next) {
        handleValidationErrors(req);
        try {
            // Garantir que id existe antes de usar parseInt
            const idParam = req.params.id;
            if (!idParam) {
                throw new AppError_1.AppError('ID de usuário não fornecido.', 400);
            }
            const id = parseInt(idParam, 10);
            if (isNaN(id)) {
                throw new AppError_1.AppError('ID de usuário inválido.', 400);
            }
            const updatedUser = await userServiceBackend_1.userServiceBackend.updateUser(id, req.body);
            res.status(200).json(updatedUser);
        }
        catch (error) {
            next(error);
        }
    },
    // DELETE /users/:id
    async deleteUser(req, res, next) {
        try {
            // Garantir que id existe antes de usar parseInt
            const idParam = req.params.id;
            if (!idParam) {
                throw new AppError_1.AppError('ID de usuário não fornecido.', 400);
            }
            const id = parseInt(idParam, 10);
            if (isNaN(id)) {
                throw new AppError_1.AppError('ID de usuário inválido.', 400);
            }
            await userServiceBackend_1.userServiceBackend.deleteUser(id);
            res.status(204).send(); // No Content
        }
        catch (error) {
            next(error);
        }
    },
    // POST /users/reset-password/:id (ou outra rota conforme necessário)
    async resetPassword(req, res, next) {
        handleValidationErrors(req); // Adicionar validação para novaSenha
        try {
            // Garantir que id existe antes de usar parseInt
            const idParam = req.params.id;
            if (!idParam) {
                throw new AppError_1.AppError('ID de usuário não fornecido.', 400);
            }
            const id = parseInt(idParam, 10);
            if (isNaN(id)) {
                throw new AppError_1.AppError('ID de usuário inválido.', 400);
            }
            const { novaSenha } = req.body;
            if (!novaSenha) {
                throw new AppError_1.AppError('Nova senha é obrigatória.', 400);
            }
            await userServiceBackend_1.userServiceBackend.resetPassword(id, novaSenha);
            res.status(204).send(); // No Content
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=userController.js.map