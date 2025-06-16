import { PrismaClient } from '@prisma/client';
import { RegisterUserDTO, LoginUserDTO, AuthResponseDTO, UserPublicProfileDTO } from '../dtos/authDtos';
declare class AuthService {
    private prisma;
    constructor(prisma: PrismaClient);
    private toPublicProfile;
    register(data: RegisterUserDTO): Promise<UserPublicProfileDTO>;
    login(data: LoginUserDTO): Promise<AuthResponseDTO>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map