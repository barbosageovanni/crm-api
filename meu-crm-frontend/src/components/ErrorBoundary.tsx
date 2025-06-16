import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Em produção, você poderia enviar este erro para um serviço de monitoramento
    if (import.meta.env.PROD) {
      // Exemplo: Sentry.captureException(error, { contexts: { errorInfo } });
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 2
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <ErrorOutline 
                sx={{ 
                  fontSize: 80, 
                  color: 'error.main', 
                  mb: 2 
                }} 
              />
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Oops! Algo deu errado
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi automaticamente notificada e está trabalhando para resolver o problema.
              </Typography>

              {/* Mostrar detalhes do erro apenas em desenvolvimento */}
              {import.meta.env.DEV && this.state.error && (
                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    bgcolor: 'grey.100', 
                    borderRadius: 1,
                    textAlign: 'left'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Detalhes do Erro (Modo Desenvolvimento):
                  </Typography>
                  <Typography 
                    variant="caption" 
                    component="pre" 
                    sx={{ 
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      `\n\nComponent Stack:${this.state.errorInfo.componentStack}`
                    )}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={this.handleRetry}
                  startIcon={<Refresh />}
                  sx={{ minWidth: 140 }}
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  startIcon={<Home />}
                  sx={{ minWidth: 140 }}
                >
                  Ir para Dashboard
                </Button>
                
                <Button
                  variant="text"
                  onClick={this.handleReload}
                  sx={{ minWidth: 140 }}
                >
                  Recarregar Página
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                Se o problema persistir, entre em contato com o suporte técnico.
              </Typography>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;