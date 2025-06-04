// src/routes/userRoutesConfig.ts
import { RouteObject } from 'react-router-dom';
import UserRoutes from '../features/users/UserRoutes';

// Configuração das rotas de usuários para integração com o App.tsx
export const userRoutesConfig: RouteObject[] = [
  {
    path: 'users/*',
    element: <UserRoutes />
  }
];
