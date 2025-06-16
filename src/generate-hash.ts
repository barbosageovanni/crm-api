// generate-hash.ts
import bcrypt from 'bcryptjs';

const generateHash = async () => {
  const newPassword = 'transpontual123'; // Use uma senha forte e que você se lembre
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('--- NOVO HASH GERADO ---');
    console.log(`Senha Original: ${newPassword}`);
    console.log(`Hash Gerado: ${hash}`);
    console.log('------------------------');
    console.log('Copie o hash gerado e cole no campo "senhaHash" do seu usuário no Prisma Studio.');

  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
};

generateHash();