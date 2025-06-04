// src/features/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Logo (substitua pelo seu logo real)
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
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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

    const loginData: LoginUserDTO = { email, senha };

    try {
      await login(loginData);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Falha no login. Verifique suas credenciais.';
      setError(errorMessage);
      console.error('Erro de login:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
                E-mail
              </Typography>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                placeholder="exemplo@empresa.com.br"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                variant="outlined"
                size="small"
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Senha
              </Typography>
              <FormControl fullWidth variant="outlined" size="small">
                <OutlinedInput
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  sx={{ borderRadius: 1 }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
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
              disabled={isLoading}
            >
              {isLoading ? 'Autenticando...' : 'Autenticação'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link href="#" variant="body2" sx={{ color: '#0066B3', textDecoration: 'none' }}>
                Esqueceu sua senha?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
      
      <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 3, mb: 3 }}>
        {'Copyright © '}
        <Link color="inherit" href="#">
          CRM Transpontual
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    </Box>
  );
}
