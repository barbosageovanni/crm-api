// test-server.ts - Versão simplificada para teste
import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de teste funcionando!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({
    user: { id: 1, nome: 'Teste', email: 'teste@test.com', papel: 'ADMIN', ativo: true },
    token: 'teste-token',
    message: 'Login realizado com sucesso!'
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor teste rodando na porta ${PORT}`);
});
