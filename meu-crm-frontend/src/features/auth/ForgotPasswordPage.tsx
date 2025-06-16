import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Componentes MUI
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

// Logo (mesmo padrão do LoginPage)
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // CORREÇÃO: Função melhorada com try/catch completo
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // Validação básica do email
      if (!email.trim()) {
        throw new Error('E-mail é obrigatório.');
      }

      if (!isValidEmail(email)) {
        throw new Error('E-mail inválido. Verifique e tente novamente.');
      }

      // CORREÇÃO: Tratamento específico para API não implementada
      try {
        await resetPassword(email.trim());
        setEmailSent(true);
        setMessage('Instruções para redefinir sua senha foram enviadas para seu e-mail.');
      } catch (apiError: any) {
        // CORREÇÃO: Tratamento específico para rota não encontrada (404)
        if (apiError.message?.includes('Rota não encontrada') || apiError.status === 404) {
          setError('Funcionalidade de reset de senha ainda não está disponível. Entre em contato com o suporte.');
        } else {
          // Outros erros da API
          const errorMessage = apiError.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.';
          setError(errorMessage);
        }
      }
    } catch (validationError: any) {
      // Erros de validação local
      console.error('Erro de validação:', validationError);
      setError(validationError.message || 'Erro de validação. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setMessage(null);
    setError(null);
    setEmail('');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const canSubmit = email.trim() && isValidEmail(email) && !isLoading;

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
        m: 'auto'
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
          {/* Botão de voltar */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
            <IconButton 
              onClick={handleBackToLogin}
              sx={{ color: '#0066B3' }}
              size="small"
              disabled={isLoading}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>

          <Logo />
          
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'medium', textAlign: 'center' }}>
            Redefinir sua senha
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', px: 2 }}>
            {emailSent 
              ? 'Verifique seu e-mail para continuar com a redefinição da senha.'
              : 'Insira seu e-mail para receber instruções de como redefinir sua senha.'
            }
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          {!emailSent && (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  E-mail
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  variant="outlined"
                  size="small"
                  error={email.trim() !== '' && !isValidEmail(email)} // CORREÇÃO: Boolean
                  helperText={email.trim() && !isValidEmail(email) ? 'E-mail inválido' : ''} // CORREÇÃO: String
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
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
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </Box>
          )}

          {emailSent && (
            <Box sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ 
                  mt: 1, 
                  mb: 2, 
                  py: 1.2,
                  textTransform: 'none',
                  borderRadius: 1,
                  fontWeight: 'medium',
                  color: '#0066B3',
                  borderColor: '#0066B3'
                }}
                onClick={handleTryAgain}
              >
                Tentar novamente
              </Button>
            </Box>
          )}
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link 
              to="/login" 
              style={{ textDecoration: 'none' }}
            >
              <Button 
                variant="text" 
                sx={{ color: '#0066B3', textTransform: 'none' }}
                disabled={isLoading}
              >
                Voltar para o login
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>
      
      <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 3, mb: 3 }}>
        {'Copyright © '}
        <Link to="#" style={{ color: 'inherit' }}>
          Básico Management
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    </Box>
  );
}