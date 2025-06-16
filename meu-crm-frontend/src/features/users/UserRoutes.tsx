// src/features/users/UserRoutes.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import UserListPage from '../../features/users/UserListPage';
import UserForm from '../../features/users/UserForm';
import ResetPasswordForm from '../../features/users/ResetPasswordForm';
import userService from '../../features/users/userService';
import type { UserDTO } from '../../features/users/userDtos';

// Componentes MUI
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// Componente para edição de usuário
const EditUserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        const userData = await userService.getUserById(parseInt(id));
        setUser(userData);
      } catch (err: any) {
        console.error('Erro ao buscar usuário:', err);
        setError('Não foi possível carregar os dados do usuário. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/users')}>
          Voltar para a lista
        </Button>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Usuário não encontrado.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/users')}>
          Voltar para a lista
        </Button>
      </Container>
    );
  }

  return <UserForm user={user} isEdit={true} />;
};

// Componente principal de rotas
export default function UserRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UserListPage />} />
      <Route path="/new" element={<UserForm />} />
      <Route path="/:id/edit" element={<EditUserPage />} />
      <Route path="/:id/edit" element={<EditUserPage />} />
      <Route path="/:id/reset-password" element={<ResetPasswordForm />} />
    </Routes>
  );
}
