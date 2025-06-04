// src/features/auth/authDtos.ts

// Papel do usuário (deve corresponder ao backend)
export const PapelUsuarioEnum = { // Renomeado para clareza que é um objeto de enum
  ADMIN: 'ADMIN',
  USUARIO: 'USUARIO',
  VENDEDOR: 'VENDEDOR',
  GERENTE: 'GERENTE'
} as const;

export type PapelUsuario = typeof PapelUsuarioEnum[keyof typeof PapelUsuarioEnum];

// DTO para login
export interface LoginUserDTO {
  email: string;
  senha: string;
}

// DTO para registro
export interface RegisterUserDTO {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  // confirmaSenha é geralmente usado apenas no estado do formulário frontend, não no DTO de dados.
  // Se precisar no tipo do formulário, crie uma interface separada para o estado do formulário.
}

// DTO do perfil do usuário (como retornado pela API e usado no frontend)
export interface UserProfileDTO {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo?: boolean; // Adicionado como opcional, pode vir ou não do perfil
  createdAt: string; // Datas como string (ISO) são comuns em respostas JSON
  updatedAt: string;
}

// DTO para a resposta da autenticação bem-sucedida (login ou registro).
// ESTA É A ÚNICA DEFINIÇÃO DE AuthResponseDTO
export interface AuthResponseDTO {
  user: UserProfileDTO;   // Contém os dados do perfil do usuário.
  token: string;          // O token JWT gerado.
  message?: string;        // Mensagem opcional de sucesso (ex: "Login bem-sucedido!").
}

// DTO para atualização de perfil
export interface UpdateProfileDTO {
  nome?: string;
  email?: string;
  // Outros campos que podem ser atualizados, exceto senha ou papel, que geralmente têm fluxos próprios.
}

// DTO para alteração de senha
export interface ChangePasswordDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmaNovaSenha: string; // Para validação no formulário do frontend.
}

// A exportação 'export type PapelUsuarioValues = PapelUsuario;' era redundante,
// pois PapelUsuario já é o tipo dos valores.
// Se você precisar de um array com os valores do enum para um <select>, por exemplo:
// export const listaPapeisUsuario = Object.values(PapelUsuarioEnum);