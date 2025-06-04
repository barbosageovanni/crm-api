// src/features/dashboard/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientService, { type ClienteDTO, TipoCliente } from '../clients/clientService';

// Componentes MUI
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Ícones
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface DashboardStats {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  pessoasFisicas: number;
  pessoasJuridicas: number;
  clientesRecentes: ClienteDTO[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    pessoasFisicas: 0,
    pessoasJuridicas: 0,
    clientesRecentes: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar todos os clientes para calcular estatísticas
      const response = await clientService.getClientes(1, 100); // Busca uma quantidade maior para estatísticas
      const clientes = response.data;
      
      // Buscar clientes recentes (últimos 5)
      const recentResponse = await clientService.getClientes(1, 5);
      
      // Calcular estatísticas
      const totalClientes = response.pagination.total;
      const clientesAtivos = clientes.filter(c => c.ativo).length;
      const clientesInativos = clientes.filter(c => !c.ativo).length;
      const pessoasFisicas = clientes.filter(c => c.tipo === TipoCliente.PF).length;
      const pessoasJuridicas = clientes.filter(c => c.tipo === TipoCliente.PJ).length;
      
      setStats({
        totalClientes,
        clientesAtivos,
        clientesInativos,
        pessoasFisicas,
        pessoasJuridicas,
        clientesRecentes: recentResponse.data,
      });
      
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cards de estatísticas
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary',
    subtitle 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtitle?: string;
  }) => (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.contrastText`,
            mr: 2
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral da gestão de clientes
        </Typography>
      </Box>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Clientes"
            value={stats.totalClientes}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clientes Ativos"
            value={stats.clientesAtivos}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pessoas Físicas"
            value={stats.pessoasFisicas}
            icon={<PersonIcon />}
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pessoas Jurídicas"
            value={stats.pessoasJuridicas}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Ações Rápidas e Clientes Recentes */}
      <Grid container spacing={3}>
        {/* Card de Ações Rápidas */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/clients/new')}
                fullWidth
              >
                Novo Cliente
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/clients')}
                fullWidth
              >
                Ver Todos os Clientes
              </Button>
            </Box>

            {/* Resumo por Status */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Resumo por Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label="Ativos" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Typography variant="body2">
                    {stats.clientesAtivos}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label="Inativos" 
                    size="small" 
                    color="default" 
                    variant="outlined" 
                  />
                  <Typography variant="body2">
                    {stats.clientesInativos}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Clientes Recentes */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Clientes Recentes
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/clients')}
              >
                Ver Todos
              </Button>
            </Box>
            
            {stats.clientesRecentes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nenhum cliente cadastrado ainda
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Data Cadastro</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.clientesRecentes.map((cliente) => (
                      <TableRow 
                        key={cliente.id} 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/clients/${cliente.id}/edit`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {cliente.nome}
                          </Typography>
                          {cliente.email && (
                            <Typography variant="caption" color="text.secondary">
                              {cliente.email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.tipo === TipoCliente.PF ? 'PF' : 'PJ'}
                            size="small"
                            color={cliente.tipo === TipoCliente.PF ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cliente.ativo ? 'Ativo' : 'Inativo'}
                            size="small"
                            color={cliente.ativo ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(cliente.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}