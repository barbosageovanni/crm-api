// src/utils/documentValidator.ts

/**
 * Validador de CPF/CNPJ nativo sem dependências externas
 * Implementação robusta para ambiente de produção
 */

export class DocumentValidator {
  /**
   * Valida CPF usando algoritmo oficial da Receita Federal
   */
  static validateCPF(cpf: string): boolean {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Converte para array de números
    const digits = cleanCPF.split('').map(Number);
    
    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica primeiro dígito
    if (digits[9] !== firstDigit) return false;
    
    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica segundo dígito
    return digits[10] === secondDigit;
  }
  
  /**
   * Valida CNPJ usando algoritmo oficial da Receita Federal
   */
  static validateCNPJ(cnpj: string): boolean {
    if (!cnpj) return false;
    
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais (ex: 11.111.111/1111-11)
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Converte para array de números
    const digits = cleanCNPJ.split('').map(Number);
    
    // Sequências de multiplicadores para os cálculos
    const firstSequence = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondSequence = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * firstSequence[i];
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica primeiro dígito
    if (digits[12] !== firstDigit) return false;
    
    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += digits[i] * secondSequence[i];
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica segundo dígito
    return digits[13] === secondDigit;
  }
  
  /**
   * Formata CPF para exibição (000.000.000-00)
   */
  static formatCPF(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  /**
   * Formata CNPJ para exibição (00.000.000/0000-00)
   */
  static formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return cnpj;
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  /**
   * Remove formatação de documento
   */
  static cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
  }
  
  /**
   * Detecta automaticamente o tipo de documento e valida
   */
  static validateDocument(document: string): { isValid: boolean; type: 'CPF' | 'CNPJ' | 'UNKNOWN' } {
    const clean = this.cleanDocument(document);
    
    if (clean.length === 11) {
      return {
        isValid: this.validateCPF(clean),
        type: 'CPF'
      };
    }
    
    if (clean.length === 14) {
      return {
        isValid: this.validateCNPJ(clean),
        type: 'CNPJ'
      };
    }
    
    return {
      isValid: false,
      type: 'UNKNOWN'
    };
  }
}

// Exporta interface compatível com cpf-cnpj-validator
export const cpf = {
  isValid: (value: string): boolean => DocumentValidator.validateCPF(value),
  format: (value: string): string => DocumentValidator.formatCPF(value)
};

export const cnpj = {
  isValid: (value: string): boolean => DocumentValidator.validateCNPJ(value),
  format: (value: string): string => DocumentValidator.formatCNPJ(value)
};

// Utilitários adicionais
export const documentUtils = {
  clean: DocumentValidator.cleanDocument,
  validate: DocumentValidator.validateDocument,
  formatCPF: DocumentValidator.formatCPF,
  formatCNPJ: DocumentValidator.formatCNPJ
};