// Script temporário para listar usuários
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
      }
    });
    
    console.log('Usuários encontrados:');
    console.table(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
