// src/features/transportes/transporteServiceFrontend.ts
import { CreateTransporteDTO, UpdateTransporteDTO, TransporteDTO } from './transporteDtosFrontend';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class TransporteService {
  private baseUrl = `${API_BASE_URL}/api/transportes`;

  async createTransporte(data: CreateTransporteDTO ): Promise<TransporteDTO> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar transporte: ${response.statusText}`);
    }

    return response.json();
  }

  async getTransporteById(id: number): Promise<TransporteDTO> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar transporte: ${response.statusText}`);
    }

    return response.json();
  }

  async updateTransporte(id: number, data: UpdateTransporteDTO): Promise<TransporteDTO> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar transporte: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteTransporte(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar transporte: ${response.statusText}`);
    }
  }

  async getAllTransportes(params?: { clienteId?: number; ativo?: boolean }): Promise<{ data: TransporteDTO[] }> {
    let url = this.baseUrl;
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.clienteId) searchParams.append('clienteId', params.clienteId.toString());
      if (params.ativo !== undefined) searchParams.append('ativo', params.ativo.toString());
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar transportes: ${response.statusText}`);
    }

    return response.json();
  }
}

const transporteService = new TransporteService();
export default transporteService;
