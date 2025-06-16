import { AxiosError } from 'axios';

// Interface para a estrutura de erro que sua API backend retorna
interface ApiErrorData {
  message: string;
  status?: string;
  errors?: any[];
}

/**
 * Type guard para verificar se um erro é um erro de API do Axios com uma resposta.
 * Isso nos permite acessar `error.response` com segurança.
 */
export function isAPIError(error: unknown): error is AxiosError<ApiErrorData> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true &&
    'response' in error &&
    (error as AxiosError).response !== undefined
  );
}

/**
 * Type guard para verificar se é um erro de rede (ex: servidor offline).
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network error') || msg.includes('econnrefused');
  }
  return false;
}