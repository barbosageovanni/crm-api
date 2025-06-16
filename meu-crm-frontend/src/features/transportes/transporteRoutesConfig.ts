// src/features/transportes/transporteRoutesConfig.ts
import React from 'react';
import { RouteObject } from 'react-router-dom';
import TransporteListPage from './TransporteListPage';
import TransporteForm from './TransporteForm';

const transporteRoutes: RouteObject[] = [
  {
    path: 'transportes',
    children: [
      {
        index: true,
        element: React.createElement(TransporteListPage)
      },
      {
        path: 'new',
        element: React.createElement(TransporteForm)
      },
      {
        path: ':id/edit',
        element: React.createElement(TransporteForm)
      }
    ]
  }
];

export default transporteRoutes;
