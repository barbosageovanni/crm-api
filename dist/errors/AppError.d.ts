/**
 * Classe base para erros operacionais customizados na aplicação.
 * Erros operacionais são erros esperados que não indicam necessariamente um bug no sistema,
 * mas sim uma condição de erro prevista (ex: entrada inválida, recurso não encontrado).
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly errors: any[] | undefined;
    /**
     * @param message A mensagem de erro principal.
     * @param statusCode O código de status HTTP associado ao erro. Padrão é 500 para AppError genérica.
     * @param errors Um array opcional de objetos ou strings detalhando múltiplos erros (útil para validação).
     * @param isOperational Indica se o erro é operacional (esperado). Padrão é true.
     */
    constructor(message: string, statusCode?: number, errors?: any[], isOperational?: boolean);
}
/**
 * Erro para indicar que um recurso solicitado não foi encontrado.
 * Código de status HTTP: 404 Not Found.
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string | number);
}
/**
 * Erro para indicar falhas de validação nos dados de entrada.
 * Código de status HTTP: 400 Bad Request.
 * Esta classe agora pode carregar um array de erros de validação específicos.
 */
export declare class ValidationError extends AppError {
    /**
     * @param validationErrors Um array de objetos detalhando os erros de validação.
     * Pode ser, por exemplo, o resultado de `errors.array()` do express-validator.
     * @param message Uma mensagem geral de erro de validação (opcional, será usada uma padrão se não fornecida).
     */
    constructor(validationErrors: any[], message?: string);
}
/**
 * Erro para indicar uma tentativa de criar um recurso que resultaria em duplicidade
 * (ex: um email ou CPF/CNPJ que já existe).
 * Código de status HTTP: 409 Conflict.
 */
export declare class DuplicateError extends AppError {
    constructor(field: string, value: string);
}
//# sourceMappingURL=AppError.d.ts.map