// src/index.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma/client';
import clienteRoutes from './routes/clienteRoutes';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/clientes', clienteRoutes);

// Health check (opcional)
app.get('/', (_req, res) => {
  res.send('API CRM Transpontual está online!');
});

// Inicialização do servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
