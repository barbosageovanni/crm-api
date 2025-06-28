// src/features/transportes/transporteService.ts
import apiClient from '@/services/apiClient';
import type { CreateTransporteDTO, UpdateTransporteDTO, TransporteDTO } from './transporteDtos';

const TRANSPORTES_ROUTE = "/transportes"; // Removido /api pois já está no baseURL

class TransporteService {
  
  // Listar todos os transportes
  async getTransportes(): Promise<TransporteDTO[]> {
    try {
      const response = await apiClient.get<{ data: TransporteDTO[] }>(TRANSPORTES_ROUTE);
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar transportes:', error);
      throw new Error('Não foi possível carregar os transportes. Tente novamente mais tarde.');
    }
  }

  // Buscar transporte por ID
  async getTransporteById(id: number): Promise<TransporteDTO> {
    try {
      const response = await apiClient.get<{ data: TransporteDTO }>(`${TRANSPORTES_ROUTE}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar transporte:', error);
      throw new Error('Não foi possível carregar o transporte. Tente novamente mais tarde.');
    }
  }

  // Criar novo transporte
  async createTransporte(data: CreateTransporteDTO): Promise<TransporteDTO> {
    try {
      const response = await apiClient.post<{ data: TransporteDTO }>(TRANSPORTES_ROUTE, data);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao criar transporte:', error);
      throw new Error('Não foi possível criar o transporte. Verifique os dados e tente novamente.');
    }
  }

  // Atualizar transporte
  async updateTransporte(id: number, data: UpdateTransporteDTO): Promise<TransporteDTO> {
    try {
      const response = await apiClient.put<{ data: TransporteDTO }>(`${TRANSPORTES_ROUTE}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao atualizar transporte:', error);
      throw new Error('Não foi possível atualizar o transporte. Verifique os dados e tente novamente.');
    }
  }

  // Deletar transporte
  async deleteTransporte(id: number): Promise<void> {
    try {
      await apiClient.delete(`${TRANSPORTES_ROUTE}/${id}`);
    } catch (error) {
      console.error('Erro ao deletar transporte:', error);
      throw new Error('Não foi possível deletar o transporte. Tente novamente mais tarde.');
    }
  }
}

// Exportar instância única
const transporteService = new TransporteService();
export default transporteService;