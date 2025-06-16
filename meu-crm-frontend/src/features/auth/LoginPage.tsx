import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { type LoginUserDTO } from '../../features/auth/authDtos';

// Componentes MUI
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Logo Component
const Logo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
    <Typography 
      variant="h5" 
      component="div" 
      sx={{ 
        fontWeight: 'bold', 
        color: '#0066B3',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Box 
        component="span" 
        sx={{ 
          bgcolor: '#0066B3', 
          color: 'white', 
          px: 1, 
          py: 0.5, 
          borderRadius: 1, 
          mr: 1, 
          fontSize: '0.8em' 
        }}
      >
        CRM
      </Box>
      Transpontual
    </Typography>
  </Box>
);

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // CORREÇÃO: Estados separados para validação de campos
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  // Validação de email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // CORREÇÃO: Validação em tempo real dos campos
  const validateEmail = (email: string) => {
    if (email.trim() && !isValidEmail(email)) {
      setEmailError(true);
      setEmailHelperText('E-mail inválido');
    } else {
      setEmailError(false);
      setEmailHelperText('');
    }
  };

  // Handlers
  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // CORREÇÃO: Validação em tempo real e limpeza de erros
    if (field === 'email') {
      validateEmail(value);
    }

    // Limpa erro geral quando usuário começa a digitar
    if (error) setError(null);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validações locais
      if (!formData.email.trim()) {
        throw new Error('E-mail é obrigatório.');
      }

      if (!isValidEmail(formData.email)) {
        throw new Error('E-mail inválido. Verifique e tente novamente.');
      }

      if (!formData.senha.trim()) {
        throw new Error('Senha é obrigatória.');
      }

      if (formData.senha.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres.');
      }

      // Verifica se a função login existe
      if (!login) {
        throw new Error('Serviço de autenticação não disponível.');
      }

      const loginData: LoginUserDTO = { 
        email: formData.email.trim(), 
        senha: formData.senha 
      };

      await login(loginData);
      
      // Salva email se "lembrar" estiver marcado
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro de login:', err);
      
      let errorMessage = 'Falha no login. Verifique suas credenciais.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Erro do servidor. Tente novamente mais tarde.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Carrega email salvo ao montar o componente
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Validação do formulário
  const canSubmit = formData.email.trim() && 
                   formData.senha.trim() && 
                   isValidEmail(formData.email) && 
                   !isLoading;

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        m: 'auto',
        bgcolor: '#f5f5f5'
      }}
    >
      <CssBaseline />
      <Container component="main" maxWidth="sm" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            width: '100%', 
            maxWidth: 450, 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Logo />
          
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
            Autenticação da conta
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                E-mail *
              </Typography>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                type="email"
                placeholder="exemplo@empresa.com.br"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={isLoading}
                variant="outlined"
                size="small"
                error={emailError} // CORREÇÃO: Boolean ao invés de string
                helperText={emailHelperText} // CORREÇÃO: String separada
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Senha *
              </Typography>
              <FormControl 
                fullWidth 
                variant="outlined" 
                size="small"
                error={passwordError} // CORREÇÃO: Boolean para FormControl também
              >
                <OutlinedInput
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={handleInputChange('senha')}
                  disabled={isLoading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  sx={{ borderRadius: 1 }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    color="primary" 
                    size="small"
                    disabled={isLoading}
                  />
                }
                label={
                  <Typography variant="body2">
                    Lembrar o meu e-mail
                  </Typography>
                }
              />
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 1, 
                mb: 2, 
                py: 1.2,
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 'medium'
              }}
              disabled={!canSubmit}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button 
                onClick={handleForgotPassword}
                variant="text" 
                sx={{ color: '#0066B3', textTransform: 'none' }}
                disabled={isLoading}
              >
                Esqueceu sua senha?
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
      
      <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 3, mb: 3 }}>
        {'Copyright © '}
        <Link component={RouterLink} to="#" color="inherit">
          Básico Management
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    </Box>
  );
}