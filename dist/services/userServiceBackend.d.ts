import type { UserDTO, CreateUserDTO, UpdateUserDTO, UserFilterParams, UserPaginatedResponse } from '../dtos/userDtos';
export declare const userServiceBackend: {
    getUsers(params: UserFilterParams): Promise<UserPaginatedResponse>;
    getUserById(id: number): Promise<UserDTO | null>;
    createUser(data: CreateUserDTO): Promise<UserDTO>;
    updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO>;
    deleteUser(id: number): Promise<void>;
    resetPassword(id: number, novaSenha: string): Promise<void>;
};
//# sourceMappingURL=userServiceBackend.d.ts.map