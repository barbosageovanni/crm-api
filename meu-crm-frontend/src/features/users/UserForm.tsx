// src/features/users/UserForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from './userService';
import type { CreateUserDTO, UpdateUserDTO, UserDTO, PapelUsuario } from '../../features/users/userDtos';

// Componentes MUI
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

// Ícones
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface UserFormProps {
  user?: UserDTO;
  isEdit?: boolean;
}

// Interface para erros de validação
interface ValidationErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  papel?: string;
}

export default function UserForm({ user, isEdit = false }: UserFormProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do formulário
  const [formValues, setFormValues] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    senha: '',
    confirmarSenha: '',
    papel: user?.papel || PapelUsuario.USUARIO,
    ativo: user?.ativo !== undefined ? user.ativo : true
  });
  
  // Estado para erros de validação
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Estado para controle de toque nos campos
  const [touched, setTouched] = useState({
    nome: false,
    email: false,
    senha: false,
    confirmarSenha: false,
    papel: false
  });

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    // Validar nome
    if (!formValues.nome) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formValues.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formValues.nome.length > 100) {
      newErrors.nome = 'Nome deve ter no máximo 100 caracteres';
    }
    
    // Validar email
    if (!formValues.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formValues.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validar senha (apenas para criação)
    if (!isEdit) {
      if (!formValues.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (formValues.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
      }
      
      // Validar confirmação de senha
      if (!formValues.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
      } else if (formValues.senha !== formValues.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não conferem';
      }
    }
    
    // Validar papel
    if (!formValues.papel) {
      newErrors.papel = 'Papel é obrigatório';
    }
    
    return newErrors;
  };

  // Manipulador de mudança de campo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, checked } = e.target as HTMLInputElement;
    
    if (name === 'ativo') {
      setFormValues(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name as string]: value
      }));
    }
    
    // Validar campo após mudança
    if (touched[name as keyof typeof touched]) {
      const fieldErrors = validateForm();
      setErrors(prev => ({
        ...prev,
        [name as string]: fieldErrors[name as keyof ValidationErrors]
      }));
    }
  };
  
  // Manipulador de blur (perda de foco)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const fieldErrors = validateForm();
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name as keyof ValidationErrors]
    }));
  };

  // Manipulador de envio do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Marcar todos os campos como tocados
    setTouched({
      nome: true,
      email: true,
      senha: true,
      confirmarSenha: true,
      papel: true
    });
    
    // Validar formulário
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // Verificar se há erros
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      if (isEdit && user) {
        // Preparar dados para atualização (remover campos de senha)
        const updateData: UpdateUserDTO = {
          nome: formValues.nome,
          email: formValues.email,
          papel: formValues.papel as PapelUsuario,
          ativo: formValues.ativo
        };
        
        await userService.updateUser(user.id, updateData);
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        // Preparar dados para criação
        const createData: CreateUserDTO = {
          nome: formValues.nome,
          email: formValues.email,
          senha: formValues.senha,
          papel: formValues.papel as PapelUsuario,
          ativo: formValues.ativo
        };
        
        await userService.createUser(createData);
        setSuccess('Usuário criado com sucesso!');
        
        // Limpar formulário após criação bem-sucedida
        if (!isEdit) {
          setFormValues({
            nome: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            papel: PapelUsuario.USUARIO,
            ativo: true
          });
          setTouched({
            nome: false,
            email: false,
            senha: false,
            confirmarSenha: false,
            papel: false
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.response?.data?.message || 'Erro ao salvar usuário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
        >
          Voltar
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="nome"
              name="nome"
              label="Nome"
              value={formValues.nome}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.nome && Boolean(errors.nome)}
              helperText={touched.nome && errors.nome}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={touched.papel && Boolean(errors.papel)}>
              <InputLabel id="papel-label" required>Papel</InputLabel>
              <Select
                labelId="papel-label"
                id="papel"
                name="papel"
                value={formValues.papel}
                onChange={handleChange}
                label="Papel"
              >
                <MenuItem value={PapelUsuario.ADMIN}>Administrador</MenuItem>
                <MenuItem value={PapelUsuario.GERENTE}>Gerente</MenuItem>
                <MenuItem value={PapelUsuario.USUARIO}>Usuário</MenuItem>
              </Select>
              {touched.papel && errors.papel && (
                <FormHelperText>{errors.papel}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.ativo}
                  onChange={handleChange}
                  name="ativo"
                  color="primary"
                />
              }
              label="Usuário ativo"
            />
          </Grid>
          
          {!isEdit && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Definir Senha
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="senha"
                  name="senha"
                  label="Senha"
                  type="password"
                  value={formValues.senha}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.senha && Boolean(errors.senha)}
                  helperText={touched.senha && errors.senha}
                  required={!isEdit}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="confirmarSenha"
                  name="confirmarSenha"
                  label="Confirmar Senha"
                  type="password"
                  value={formValues.confirmarSenha}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmarSenha && Boolean(errors.confirmarSenha)}
                  helperText={touched.confirmarSenha && errors.confirmarSenha}
                  required={!isEdit}
                />
              </Grid>
            </>
          )}
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
