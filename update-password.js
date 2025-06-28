const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);
    
    const result = await prisma.usuario.update({
      where: { email: 'admin@crmapi.com' },
      data: { senhaHash: hash }
    });
    
    console.log('Senha atualizada com sucesso!', result.email);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
