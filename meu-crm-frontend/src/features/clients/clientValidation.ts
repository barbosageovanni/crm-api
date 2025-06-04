// src/features/clients/clientValidation.ts
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { TipoCliente } from './clientService';

// Validações básicas
export const validateNome = (nome: string): boolean => {
  return nome.trim().length >= 3;
};

export const validateEmail = (email: string): boolean => {
  if (!email.trim()) return true; // Email é opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTelefone = (telefone: string): boolean => {
  if (!telefone.trim()) return true; // Telefone é opcional
  // Remove caracteres não numéricos para validação
  const cleanPhone = telefone.replace(/\D/g, '');
  // Aceita telefones com 10 ou 11 dígitos
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateDocumento = (documento: string, tipo: TipoCliente): boolean => {
  if (!documento.trim()) return true; // Documento é opcional
  
  const cleanDoc = documento.replace(/\D/g, '');
  
  if (tipo === TipoCliente.PF) {
    return cpf.isValid(cleanDoc);
  } else if (tipo === TipoCliente.PJ) {
    return cnpj.isValid(cleanDoc);
  }
  
  return false;
};

// Função para formatar CPF
export const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Função para formatar CNPJ
export const formatCNPJ = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// Função para formatar telefone
export const formatTelefone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
};

// Interface para erros de validação
export interface ClienteValidationErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo?: string;
}

// Função para validar todo o formulário
export const validateClienteForm = (data: {
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo: TipoCliente;
}): ClienteValidationErrors => {
  const errors: ClienteValidationErrors = {};

  if (!validateNome(data.nome)) {
    errors.nome = 'Nome deve ter pelo menos 3 caracteres.';
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Formato de email inválido.';
  }

  if (data.telefone && !validateTelefone(data.telefone)) {
    errors.telefone = 'Formato de telefone inválido.';
  }

  if (data.documento && !validateDocumento(data.documento, data.tipo)) {
    const docType = data.tipo === TipoCliente.PF ? 'CPF' : 'CNPJ';
    errors.documento = `${docType} inválido.`;
  }

  return errors;
};