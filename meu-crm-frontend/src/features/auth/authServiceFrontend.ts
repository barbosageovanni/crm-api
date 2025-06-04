// src/features/auth/authServiceFrontend.ts
import authService from './authService';
// CORREÇÃO: Importa RegisterUserDTO como um tipo devido ao verbatimModuleSyntax
import type { RegisterUserDTO } from './authDtos';

// Função para registrar usuário (wrapper do authService principal)
// O tipo userData aqui é RegisterUserDTO
export const registerUser = async (userData: RegisterUserDTO) => {
  // Passa os dados diretamente para o método register do serviço principal
  return await authService.register(userData);
};

// Validação de email no frontend
export const validateEmailFrontend = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validação de senha no frontend
export const validatePasswordFrontend = (password: string): boolean => {
  return password.length >= 6;
};

// Validação de nome
export const validateNameFrontend = (name: string): boolean => {
  return name.trim().length >= 3;
};

// Validação de confirmação de senha
export const validatePasswordConfirmation = (password: string, confirmPassword: string): boolean => {
  // Garante que a senha não esteja vazia antes de comparar
  return password === confirmPassword && password.length > 0;
};

// Interface para o estado do formulário de registro (inclui confirmaSenha)
// É útil ter isso aqui se validateRegistrationForm for usado fora do RegisterPage.tsx
interface RegisterFormStateForValidation extends RegisterUserDTO {
  confirmaSenha: string;
}

// Função para validar formulário completo de registro
// Recebe o estado completo do formulário do frontend
export const validateRegistrationForm = (formData: RegisterFormStateForValidation) => {
  const errors: { [key: string]: string } = {};

  if (!validateNameFrontend(formData.nome)) {
    errors.nome = 'Nome deve ter pelo menos 3 caracteres.';
  }

  if (!validateEmailFrontend(formData.email)) {
    errors.email = 'Formato de email inválido.';
  }

  if (!validatePasswordFrontend(formData.senha)) {
    errors.senha = 'Senha deve ter pelo menos 6 caracteres.';
  }

  if (!validatePasswordConfirmation(formData.senha, formData.confirmaSenha)) {
    errors.confirmaSenha = 'As senhas não coincidem.';
  }

  if (!formData.papel) {
    errors.papel = 'Papel é obrigatório.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

