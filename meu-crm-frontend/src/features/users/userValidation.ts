// src/features/users/userValidation.ts
import { PapelUsuario } from "./userDtos";

// Funções de validação simples para substituir o Yup
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Funções de validação específicas para cada tipo de formulário
export const validateCreateUser = (values: {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  papel: PapelUsuario;
}) => {
  const errors: Record<string, string> = {};

  if (!validateRequired(values.nome)) {
    errors.nome = 'Nome é obrigatório';
  } else if (!validateMinLength(values.nome, 3)) {
    errors.nome = 'Nome deve ter pelo menos 3 caracteres';
  } else if (!validateMaxLength(values.nome, 100)) {
    errors.nome = 'Nome deve ter no máximo 100 caracteres';
  }

  if (!validateRequired(values.email)) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }

  if (!validateRequired(values.senha)) {
    errors.senha = 'Senha é obrigatória';
  } else if (!validateMinLength(values.senha, 6)) {
    errors.senha = 'Senha deve ter pelo menos 6 caracteres';
  }

  if (!validateRequired(values.confirmarSenha)) {
    errors.confirmarSenha = 'Confirmação de senha é obrigatória';
  } else if (!validatePasswordMatch(values.senha, values.confirmarSenha)) {
    errors.confirmarSenha = 'As senhas não conferem';
  }

  if (!values.papel) {
    errors.papel = 'Papel é obrigatório';
  }

  return errors;
};

export const validateUpdateUser = (values: {
  nome: string;
  email: string;
  papel: PapelUsuario;
}) => {
  const errors: Record<string, string> = {};

  if (!validateRequired(values.nome)) {
    errors.nome = 'Nome é obrigatório';
  } else if (!validateMinLength(values.nome, 3)) {
    errors.nome = 'Nome deve ter pelo menos 3 caracteres';
  } else if (!validateMaxLength(values.nome, 100)) {
    errors.nome = 'Nome deve ter no máximo 100 caracteres';
  }

  if (!validateRequired(values.email)) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }

  if (!values.papel) {
    errors.papel = 'Papel é obrigatório';
  }

  return errors;
};

export const validateResetPassword = (values: {
  novaSenha: string;
  confirmarSenha: string;
}) => {
  const errors: Record<string, string> = {};

  if (!validateRequired(values.novaSenha)) {
    errors.novaSenha = 'Nova senha é obrigatória';
  } else if (!validateMinLength(values.novaSenha, 6)) {
    errors.novaSenha = 'Nova senha deve ter pelo menos 6 caracteres';
  }

  if (!validateRequired(values.confirmarSenha)) {
    errors.confirmarSenha = 'Confirmação de senha é obrigatória';
  } else if (!validatePasswordMatch(values.novaSenha, values.confirmarSenha)) {
    errors.confirmarSenha = 'As senhas não conferem';
  }

  return errors;
};
