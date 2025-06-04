import { PapelUsuario } from '@prisma/client'; // Certifique-se de que PapelUsuario está exportado pelo Prisma Client

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
  // Se você decidir que createdAt e updatedAt DEVEM estar no perfil público retornado no login,
  // adicione-os aqui. Caso contrário, eles serão omitidos conforme esta definição.
  // createdAt: Date;
  // updatedAt: Date;
}

/**
 * DTO para o corpo da requisição de registro de um novo usuário.
 */
export interface RegisterUserDTO {
  nome: string;
  email: string;
  senha: string; // A senha será recebida em texto plano e hasheada no backend.
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
  user: UserPublicProfileDTO; // CORRIGIDO: Usa UserPublicProfileDTO para consistência
  token: string;
}