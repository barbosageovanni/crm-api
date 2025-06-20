"use strict";
// src/errors/AppError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
/**
 * Classe base para erros operacionais customizados na aplicação.
 * Erros operacionais são erros esperados que não indicam necessariamente um bug no sistema,
 * mas sim uma condição de erro prevista (ex: entrada inválida, recurso não encontrado).
 */
class AppError extends Error {
    /**
     * @param message A mensagem de erro principal.
     * @param statusCode O código de status HTTP associado ao erro. Padrão é 500 para AppError genérica.
     * @param errors Um array opcional de objetos ou strings detalhando múltiplos erros (útil para validação).
     * @param isOperational Indica se o erro é operacional (esperado). Padrão é true.
     */
    constructor(message, statusCode = 500, errors, isOperational = true) {
        super(message); // Passa a mensagem para o construtor da classe Error
        this.name = this.constructor.name; // Define o nome do erro como o nome da classe
        this.statusCode = statusCode;
        this.isOperational = isOperational; // Erros da aplicação são geralmente operacionais
        this.errors = errors; // Atribui o array de erros detalhados
        // Captura o stack trace, omitindo o construtor da AppError da pilha de chamadas.
        // Isso torna o stack trace mais limpo e aponta para o local onde o AppError foi instanciado.
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Erro para indicar que um recurso solicitado não foi encontrado.
 * Código de status HTTP: 404 Not Found.
 */
class NotFoundError extends AppError {
    constructor(resource, id) {
        const message = `${resource}${id ? ` com ID '${id}'` : ''} não encontrado(a).`;
        super(message, 404); // 404 Not Found
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Erro para indicar falhas de validação nos dados de entrada.
 * Código de status HTTP: 400 Bad Request.
 * Esta classe agora pode carregar um array de erros de validação específicos.
 */
class ValidationError extends AppError {
    /**
     * @param validationErrors Um array de objetos detalhando os erros de validação.
     * Pode ser, por exemplo, o resultado de `errors.array()` do express-validator.
     * @param message Uma mensagem geral de erro de validação (opcional, será usada uma padrão se não fornecida).
     */
    constructor(validationErrors, message = 'Erro de validação nos dados de entrada.') {
        // Passa a mensagem, o statusCode 400, e o array de erros de validação para o construtor da AppError.
        super(message, 400, validationErrors); // 400 Bad Request
    }
}
exports.ValidationError = ValidationError;
/**
 * Erro para indicar uma tentativa de criar um recurso que resultaria em duplicidade
 * (ex: um email ou CPF/CNPJ que já existe).
 * Código de status HTTP: 409 Conflict.
 */
class DuplicateError extends AppError {
    constructor(field, value) {
        const message = `O campo '${field}' com o valor '${value}' já está em uso.`;
        super(message, 409); // 409 Conflict
    }
}
exports.DuplicateError = DuplicateError;
// Você pode adicionar outras classes de erro customizadas conforme a necessidade:
// export class AuthenticationError extends AppError {
//   constructor(message: string = 'Não autenticado.') {
//     super(message, 401); // 401 Unauthorized
//   }
// }
// export class AuthorizationError extends AppError {
//   constructor(message: string = 'Você não tem permissão para realizar esta ação.') {
//     super(message, 403); // 403 Forbidden
//   }
// }
//# sourceMappingURL=AppError.js.map