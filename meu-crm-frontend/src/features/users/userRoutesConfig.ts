// src/routes/userRoutesConfig.ts
import React from 'react';
import { RouteObject } from 'react-router-dom';
import UserRoutes from './UserRoutes';

// Configuração das rotas de usuários para integração com o App.tsx
export const userRoutesConfig: RouteObject[] = [
  {
    path: 'users/*',
    element: React.createElement(UserRoutes)
  }
];
