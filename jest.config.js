/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'], // Define o diretório raiz para os testes e código fonte
  testMatch: [
    '**/__tests__/**/*.test.ts', // Padrão para encontrar arquivos de teste
  ],
  moduleNameMapper: {
    // Mapeia os aliases definidos no tsconfig.json para o Jest
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/errors/(.*)$': '<rootDir>/src/errors/$1',
    // Adicione outros mapeamentos se necessário
    
    // Mock para o Prisma Client - necessário porque o jest.mock pode não funcionar corretamente
    // com a forma como o Prisma Client é gerado ou importado em alguns cenários.
    // Ajuste o caminho se o seu cliente Prisma estiver em um local diferente.

  },
  // Se você tiver arquivos de setup (ex: para configurar mocks globais antes dos testes)
  // setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // Cobertura de código (opcional, mas recomendado)
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8', // ou 'babel'
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts', // Exclui o ponto de entrada principal
    '!src/types/**/*.ts', // Exclui arquivos de definição de tipo
    '!src/prisma/**/*.ts', // Exclui arquivos gerados pelo Prisma ou schema
    '!src/config/**/*.ts', // Exclui arquivos de configuração
    '!src/utils/logger.ts', // Exclui logger se não for testável unitariamente
    '!src/controllers/healthController.ts', // Exclui health controller se simples
    '!**/__tests__/**', // Exclui os próprios arquivos de teste
    '!**/node_modules/**',
  ],
  // Adiciona um timeout maior se os testes estiverem demorando (ex: testes de integração)
  // testTimeout: 30000, 
};

