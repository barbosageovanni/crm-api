// src/features/users/ResetPasswordForm.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from './userService';
import { ResetPasswordDTO } from '../../features/users/userDtos';

// Componentes MUI
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// Ícones
import KeyIcon from '@mui/icons-material/Key';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Interface para erros de validação
interface ValidationErrors {
  novaSenha?: string;
  confirmarSenha?: string;
}

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || '0');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do formulário
  const [formValues, setFormValues] = useState({
    novaSenha: '',
    confirmarSenha: '',
  });
  
  // Estado para erros de validação
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Estado para controle de toque nos campos
  const [touched, setTouched] = useState({
    novaSenha: false,
    confirmarSenha: false,
  });

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    // Validar nova senha
    if (!formValues.novaSenha) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (formValues.novaSenha.length < 6) {
      newErrors.novaSenha = 'Nova senha deve ter pelo menos 6 caracteres';
    }
    
    // Validar confirmação de senha
    if (!formValues.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formValues.novaSenha !== formValues.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não conferem';
    }
    
    return newErrors;
  };

  // Manipulador de mudança de campo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo após mudança
    if (touched[name as keyof typeof touched]) {
      const fieldErrors = validateForm();
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name as keyof ValidationErrors]
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
      novaSenha: true,
      confirmarSenha: true,
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
      const resetData: ResetPasswordDTO = {
        userId,
        novaSenha: formValues.novaSenha
      };
      
      await userService.resetPassword(resetData);
      setSuccess('Senha redefinida com sucesso!');
      
      // Limpar formulário
      setFormValues({
        novaSenha: '',
        confirmarSenha: '',
      });
      
      setTouched({
        novaSenha: false,
        confirmarSenha: false,
      });
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Redefinir Senha
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Defina uma nova senha para o usuário.
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="novaSenha"
              name="novaSenha"
              label="Nova Senha"
              type="password"
              value={formValues.novaSenha}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.novaSenha && Boolean(errors.novaSenha)}
              helperText={touched.novaSenha && errors.novaSenha}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="confirmarSenha"
              name="confirmarSenha"
              label="Confirmar Nova Senha"
              type="password"
              value={formValues.confirmarSenha}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmarSenha && Boolean(errors.confirmarSenha)}
              helperText={touched.confirmarSenha && errors.confirmarSenha}
              required
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <KeyIcon />}
            disabled={isSubmitting}
            sx={{ minWidth: 150 }}
          >
            {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
