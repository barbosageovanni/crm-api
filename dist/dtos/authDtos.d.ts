import { PapelUsuario } from '@prisma/client';
/**
 * DTO para representar os dados públicos do usuário,
 * geralmente usado para retornar informações do usuário sem expor campos sensíveis.
 */
export interface UserPublicProfileDTO {
    id: number;
    nome: string;
    email: string;
    papel: PapelUsuario;
    ativo: boolean;
}
/**
 * DTO para o corpo da requisição de registro de um novo usuário.
 */
export interface RegisterUserDTO {
    nome: string;
    email: string;
    senha: string;
    papel: PapelUsuario;
}
/**
 * DTO para o corpo da requisição de login de um usuário.
 */
export interface LoginUserDTO {
    email: string;
    senha: string;
}
/**
 * DTO para a resposta da autenticação bem-sucedida.
 * O campo 'user' agora usa UserPublicProfileDTO.
 */
export interface AuthResponseDTO {
    user: UserPublicProfileDTO;
    token: string;
}
//# sourceMappingURL=authDtos.d.ts.map