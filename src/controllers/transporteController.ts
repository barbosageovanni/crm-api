console.log("LOG: transporteController.ts está sendo carregado");


import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { transporteService } from '../services/transporteService';
// Solução alternativa com importações individuais
import { body } from 'express-validator';
import { query } from 'express-validator';
import { param } from 'express-validator';
import { validationResult } from 'express-validator';
import { matchedData } from 'express-validator';

const prisma = new PrismaClient();

// Listar todos os transportes
export const getTransportes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const clienteId = req.query.clienteId ? parseInt(req.query.clienteId as string) : undefined;
    const search = req.query.search as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const sortBy = req.query.sortBy as string || 'dataOperacao';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

    const filters = {
      clienteId,
      search,
      dateFrom,
      dateTo
    };

    const pagination = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    const result = await transporteService.getAllTransportes(filters, pagination);

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar transportes:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os transportes'
    });
  }
};

// Buscar transporte por ID
export const getTransporteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transporte = await transporteService.getTransporteById(parseInt(id));

    res.json(transporte);
  } catch (error: any) {
    console.error('Erro ao buscar transporte:', error);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ 
        error: 'Transporte não encontrado',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o transporte'
    });
  }
};

// Criar novo transporte
export const createTransporte = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      clienteId,
      numeroCteOc,
      dataOperacao,
      valorTotal,
      placaVeiculo,
      fatura,
      valorFrete,
      observacoes,
      dataColeta,
      // dataEntregaPrevista removido
      dataEnvioFaturamento,
      dataVencimento,
      dataAtesto,
      dataNotaFiscal,
      descricaoNotaFiscal,
      status
    } = req.body;

    // Validações básicas
    if (!clienteId || !numeroCteOc || !dataOperacao || !valorTotal) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        message: 'Cliente, número CTE/OC, data de operação e valor total são obrigatórios'
      });
    }

    const transporte = await transporteService.createTransporte({
      clienteId,
      numeroCteOc,
      dataOperacao,
      valorTotal,
      placaVeiculo,
      fatura,
      valorFrete,
      observacoes,
      dataColeta,
      // dataEntregaPrevista removido
      dataEnvioFaturamento,
      dataVencimento,
      dataAtesto,
      dataNotaFiscal,
      descricaoNotaFiscal,
      status
    });

    res.status(201).json({
      message: 'Transporte criado com sucesso',
      transporte
    });
  } catch (error: any) {
    console.error('Erro ao criar transporte:', error);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'Recurso não encontrado',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o transporte'
    });
  }
};

// Atualizar transporte
export const updateTransporte = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      numeroCteOc,
      dataOperacao,
      valorTotal,
      placaVeiculo,
      fatura,
      valorFrete,
      observacoes,
      dataColeta,
      // dataEntregaPrevista removido
      dataEnvioFaturamento,
      dataVencimento,
      dataAtesto,
      dataNotaFiscal,
      descricaoNotaFiscal,
      status
    } = req.body;

    const transporte = await transporteService.updateTransporte(parseInt(id), {
      numeroCteOc,
      dataOperacao,
      valorTotal,
      placaVeiculo,
      fatura,
      valorFrete,
      observacoes,
      dataColeta,
      // dataEntregaPrevista removido
      dataEnvioFaturamento,
      dataVencimento,
      dataAtesto,
      dataNotaFiscal,
      descricaoNotaFiscal,
      status
    });

    res.json({
      message: 'Transporte atualizado com sucesso',
      transporte
    });
  } catch (error: any) {
    console.error('Erro ao atualizar transporte:', error);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'Transporte não encontrado',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o transporte'
    });
  }
};

// Deletar transporte
export const deleteTransporte = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await transporteService.deleteTransporte(parseInt(id));

    res.json({
      message: 'Transporte deletado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar transporte:', error);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'Transporte não encontrado',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Não foi possível deletar o transporte'
    });
  }
};

// Validações para criação de transporte
export const validateCreateTransporte = [
  body('clienteId').isInt().withMessage('ID do cliente deve ser um número inteiro'),
  body('numeroCteOc').isString().notEmpty().withMessage('Número CTE/OC é obrigatório'),
  body('dataOperacao').isISO8601().withMessage('Data de operação deve ser uma data válida'),
  body('valorTotal').isNumeric().withMessage('Valor total deve ser um número'),
  body('placaVeiculo').optional().isString(),
  body('fatura').optional().isString(),
  body('valorFrete').optional().isNumeric().withMessage('Valor do frete deve ser um número'),
  body('observacoes').optional().isString(),
  body('dataColeta').optional().isISO8601().withMessage('Data de coleta deve ser uma data válida'),
  // dataEntregaPrevista removido
  body('dataEnvioFaturamento').optional().isISO8601().withMessage('Data de envio para faturamento deve ser uma data válida'),
  body('dataVencimento').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
  body('dataAtesto').optional().isISO8601().withMessage('Data de atesto deve ser uma data válida'),
  body('dataNotaFiscal').optional().isISO8601().withMessage('Data da nota fiscal deve ser uma data válida'),
  body('descricaoNotaFiscal').optional().isString(),
  body('status').optional().isString()
];

// Validações para atualização de transporte
export const validateUpdateTransporte = [
  body('numeroCteOc').optional().isString().notEmpty().withMessage('Número CTE/OC não pode ser vazio'),
  body('dataOperacao').optional().isISO8601().withMessage('Data de operação deve ser uma data válida'),
  body('valorTotal').optional().isNumeric().withMessage('Valor total deve ser um número'),
  body('placaVeiculo').optional().isString(),
  body('fatura').optional().isString(),
  body('valorFrete').optional().isNumeric().withMessage('Valor do frete deve ser um número'),
  body('observacoes').optional().isString(),
  body('dataColeta').optional().isISO8601().withMessage('Data de coleta deve ser uma data válida'),
  // dataEntregaPrevista removido
  body('dataEnvioFaturamento').optional().isISO8601().withMessage('Data de envio para faturamento deve ser uma data válida'),
  body('dataVencimento').optional().isISO8601().withMessage('Data de vencimento deve ser uma data válida'),
  body('dataAtesto').optional().isISO8601().withMessage('Data de atesto deve ser uma data válida'),
  body('dataNotaFiscal').optional().isISO8601().withMessage('Data da nota fiscal deve ser uma data válida'),
  body('descricaoNotaFiscal').optional().isString(),
  body('status').optional().isString()
];
