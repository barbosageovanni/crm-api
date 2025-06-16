export declare const PapelUsuario: {
    readonly ADMIN: "ADMIN";
    readonly GERENTE: "GERENTE";
    readonly USUARIO: "USUARIO";
};
export type PapelUsuario = typeof PapelUsuario[keyof typeof PapelUsuario];
export interface UserDTO {
    id: number;
    nome: string;
    email: string;
    papel: PapelUsuario;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateUserDTO {
    nome: string;
    email: string;
    senha: string;
    papel: string;
    ativo: boolean;
}
export interface UpdateUserDTO {
    nome: string;
    email: string;
    papel: PapelUsuario;
    ativo: boolean;
}
export interface ResetPasswordDTO {
    userId: number;
    novaSenha: string;
}
export interface UserFilterParams {
    nome?: string;
    email?: string;
    papel?: PapelUsuario;
    ativo?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface UserPaginatedResponse {
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=userDtos.d.ts.map