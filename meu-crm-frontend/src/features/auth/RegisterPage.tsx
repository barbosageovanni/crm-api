// src/features/auth/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Serviços de autenticação e DTOs
import {
  registerUser,
  validateEmailFrontend,
  validatePasswordFrontend,
  validateNameFrontend,
  validatePasswordConfirmation
} from './authServiceFrontend';
// Importa tanto o TIPO 'PapelUsuario' quanto o ENUM 'PapelUsuarioEnum'
import { type RegisterUserDTO, type PapelUsuario, PapelUsuarioEnum } from './authDtos';

// Componentes MUI
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';

// Interface para o estado completo do formulário (incluindo campos de validação)
// Usa o TIPO PapelUsuario aqui
interface RegisterFormState extends Omit<RegisterUserDTO, 'papel'> { // Omit papel para redefinir o tipo
  papel: PapelUsuario; // Usa o tipo PapelUsuario
  confirmaSenha: string;
}

// Interface para os erros do formulário
interface RegisterFormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmaSenha?: string;
  papel?: string;
}

export default function RegisterPage() {
  // Estado para os dados do formulário
  const [formState, setFormState] = useState<RegisterFormState>({
    nome: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    // Usa o VALOR do Enum para o estado inicial
    papel: PapelUsuarioEnum.USUARIO,
  });

  // Estado para erros de campo específicos
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});

  // Estado para erros gerais da API ou sucesso
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (
    // O tipo do evento do Select usa o TIPO PapelUsuario
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<PapelUsuario>
  ) => {
    const { name, value } = event.target;
    // O valor do Select será um dos valores do Enum (string)
    setFormState(prev => ({ ...prev, [name]: value as PapelUsuario })); // Cast para o tipo PapelUsuario

    // Limpa o erro do campo específico ao começar a digitar/mudar
    if (fieldErrors[name as keyof RegisterFormErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Limpa a mensagem geral do formulário também
    setFormMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    if (!validateNameFrontend(formState.nome)) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres.';
    }

    if (!validateEmailFrontend(formState.email)) {
      newErrors.email = 'Formato de email inválido.';
    }

    if (!validatePasswordFrontend(formState.senha)) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres.';
    }

    if (!validatePasswordConfirmation(formState.senha, formState.confirmaSenha)) {
      newErrors.confirmaSenha = 'As senhas não coincidem.';
    }

    // Verifica se o papel (que é um valor do Enum) existe
    if (!formState.papel || !Object.values(PapelUsuarioEnum).includes(formState.papel)) {
      newErrors.papel = 'Papel é obrigatório.';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Prepara o DTO para enviar ao backend (APENAS os campos do RegisterUserDTO)
    // O tipo de 'papel' aqui já é PapelUsuario (string)
    const dataToSubmit: RegisterUserDTO = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    try {
      await registerUser(dataToSubmit);

      setFormMessage({
        type: 'success',
        text: 'Conta criada com sucesso! Fazendo login automático...'
      });

      // Login automático após registro bem-sucedido
      setTimeout(async () => {
        try {
          await login({
            email: formState.email,
            senha: formState.senha,
          });
          navigate('/dashboard');
        } catch (loginError: any) {
          console.error('Erro no login automático pós-registro:', loginError);
          navigate('/login', {
            state: {
              message: 'Conta criada! Por favor, faça login para continuar.',
              emailPreenchido: formState.email
            }
          });
        } finally {
          setIsLoading(false);
        }
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
                           err.message ||
                           'Erro ao criar conta. Verifique os dados e tente novamente.';

      // Tenta direcionar o erro para o campo específico se possível
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors = err.response.data.errors.reduce((acc: any, errorItem: any) => {
          if (errorItem.path) acc[errorItem.path] = errorItem.msg;
          return acc;
        }, {});
        setFieldErrors(prev => ({...prev, ...backendErrors}));

        if (!Object.keys(backendErrors).length) {
          setFormMessage({ type: 'error', text: errorMessage });
        }
      } else if (errorMessage.toLowerCase().includes('email')) {
        setFieldErrors(prev => ({ ...prev, email: errorMessage }));
      } else {
        setFormMessage({ type: 'error', text: errorMessage });
      }

      console.error('Erro de registro:', err);
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Criar Conta
        </Typography>

        {formMessage && (
          <Alert severity={formMessage.type} sx={{ width: '100%', mt: 2, mb: 1 }}>
            {formMessage.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="nome"
                label="Nome Completo"
                name="nome"
                autoComplete="name"
                autoFocus
                value={formState.nome}
                onChange={handleInputChange}
                error={!!fieldErrors.nome}
                helperText={fieldErrors.nome}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Endereço de Email"
                name="email"
                autoComplete="email"
                value={formState.email}
                onChange={handleInputChange}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              {/* O tipo do SelectChangeEvent é PapelUsuario */}
              <FormControl fullWidth required error={!!fieldErrors.papel} disabled={isLoading}>
                <InputLabel id="papel-select-label">Papel</InputLabel>
                <Select<PapelUsuario> // Especifica o tipo do valor do Select
                  labelId="papel-select-label"
                  id="papel"
                  name="papel"
                  value={formState.papel} // O valor do estado é do tipo PapelUsuario
                  label="Papel"
                  onChange={handleInputChange}
                >
                  {/* Usa os VALORES do Enum para os MenuItems */}
                  <MenuItem value={PapelUsuarioEnum.USUARIO}>Usuário</MenuItem>
                  <MenuItem value={PapelUsuarioEnum.VENDEDOR}>Vendedor</MenuItem>
                  <MenuItem value={PapelUsuarioEnum.GERENTE}>Gerente</MenuItem>
                  <MenuItem value={PapelUsuarioEnum.ADMIN}>Administrador</MenuItem>
                </Select>
                {fieldErrors.papel && (
                  <Typography variant="caption" color="error" sx={{ml: 1.5}}>
                    {fieldErrors.papel}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="senha"
                label="Senha"
                type="password"
                id="senha"
                autoComplete="new-password"
                value={formState.senha}
                onChange={handleInputChange}
                error={!!fieldErrors.senha}
                helperText={fieldErrors.senha || 'Mínimo 6 caracteres'}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmaSenha"
                label="Confirmar Senha"
                type="password"
                id="confirmaSenha"
                value={formState.confirmaSenha}
                onChange={handleInputChange}
                error={!!fieldErrors.confirmaSenha}
                helperText={fieldErrors.confirmaSenha}
                disabled={isLoading}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Criando Conta...' : 'Criar Conta'}
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Faça login
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5, mb: 4 }}>
        {'Copyright © '}
        <Link color="inherit" href="#">CRM Transpontual</Link>{' '}
        {new Date().getFullYear()}.
      </Typography>
    </Container>
  );
}

