// src/types/cpf-cnpj-validator.d.ts
declare module 'cpf-cnpj-validator' {
  export const cpf: {
    isValid(value: string): boolean;
  };
  export const cnpj: {
    isValid(value: string): boolean;
  };
}
