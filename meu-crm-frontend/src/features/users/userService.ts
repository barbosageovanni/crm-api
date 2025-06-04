import apiClient from '../../services/apiClient';
import { PapelUsuario } from '../../features/users/userDtos';
import type {
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  ResetPasswordDTO,
  UserFilterParams,
  UserPaginatedResponse
} from '../../features/users/userDtos';

const BASE_URL = '/users';

// Serviço para gerenciamento de usuários
const userService = {
  // Obter lista paginada de usuários com filtros opcionais
  getUsers: async (params: UserFilterParams = {}): Promise<UserPaginatedResponse> => {
    try {
      const response = await apiClient.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao obter usuários:", error);
      throw error;
    }
  },

  // Obter usuário por ID
  getUserById: async (id: number): Promise<UserDTO> => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter usuário ${id}:`, error);
      throw error;
    }
  },

  // Criar novo usuário
  createUser: async (userData: CreateUserDTO): Promise<UserDTO> => {
    try {
      const response = await apiClient.post(BASE_URL, userData);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  },

  // Atualizar usuário existente
  updateUser: async (id: number, userData: UpdateUserDTO): Promise<UserDTO> => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${id}:`, error);
      throw error;
    }
  },

  // Excluir usuário
  deleteUser: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir usuário ${id}:`, error);
      throw error;
    }
  },

  // Redefinir senha de usuário
  resetPassword: async (resetData: ResetPasswordDTO): Promise<void> => {
    try {
      await apiClient.post(`${BASE_URL}/reset-password`, resetData);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      throw error;
    }
  }
};

export default userService;