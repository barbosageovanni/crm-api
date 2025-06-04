// src/features/clients/ClientListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import clientService, { 
  type ClienteDTO, 
  type PaginatedResponse,
  type ClienteFilters,
  TipoCliente 
} from './clientService';

// Componentes MUI
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// Ícones
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';

export default function ClientListPage() {
  const navigate = useNavigate();

  // Estados principais
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Estados de filtro
  const [filters, setFilters] = useState<ClienteFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoCliente | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    cliente: ClienteDTO | null;
  }>({ open: false, cliente: null });

  // Buscar clientes
  const fetchClientes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await clientService.getClientes(
        pagination.page,
        pagination.limit,
        filters
      );
      
      setClientes(data.data);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      });
    } catch (err: any) {
      console.error("Erro ao buscar clientes:", err);
      setError('Erro ao carregar lista de clientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect para buscar clientes quando filtros ou paginação mudam
  useEffect(() => {
    fetchClientes();
  }, [pagination.page, filters]);

  // Manipular mudança de página
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Manipular busca por texto
  const handleSearch = () => {
    const newFilters: ClienteFilters = { ...filters };
    
    if (searchTerm.trim()) {
      newFilters.search = searchTerm.trim();
    } else {
      delete newFilters.search;
    }

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Manipular Enter na busca
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Manipular filtro por tipo
  const handleTipoFilterChange = (event: SelectChangeEvent) => {
    const valor = event.target.value;
    setTipoFilter(valor as TipoCliente | '');
    
    const newFilters: ClienteFilters = { ...filters };
    if (valor) {
      newFilters.tipo = valor as TipoCliente;
    } else {
      delete newFilters.tipo;
    }
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Manipular filtro por status
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    const valor = event.target.value;
    setStatusFilter(valor as boolean | '');
    
    const newFilters: ClienteFilters = { ...filters };
    if (valor !== '') {
      newFilters.ativo = valor === 'true';
    } else {
      delete newFilters.ativo;
    }
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setTipoFilter('');
    setStatusFilter('');
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Abrir dialog de confirmação de exclusão
  const handleDeleteClick = (cliente: ClienteDTO) => {
    setDeleteDialog({ open: true, cliente });
  };

  // Fechar dialog de exclusão
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, cliente: null });
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.cliente) return;

    try {
      await clientService.deleteCliente(deleteDialog.cliente.id);
      setDeleteDialog({ open: false, cliente: null });
      fetchClientes(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      setError('Erro ao deletar cliente. Tente novamente.');
    }
  };

  // Formatar documento para exibição
  const formatDocument = (documento: string | undefined, tipo: TipoCliente) => {
    if (!documento) return '-';
    
    const clean = documento.replace(/\D/g, '');
    if (tipo === TipoCliente.PF && clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (tipo === TipoCliente.PJ && clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
  };

  // Formatar telefone para exibição
  const formatPhone = (telefone: string | undefined) => {
    if (!telefone) return '-';
    
    const clean = telefone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestão de Clientes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie todos os clientes cadastrados no sistema
        </Typography>
      </Box>

      {/* Filtros e Ações */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Campo de busca */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel htmlFor="search-input">Buscar clientes</InputLabel>
              <OutlinedInput
                id="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                }
                label="Buscar clientes"
                placeholder="Nome, email ou documento..."
              />
            </FormControl>
          </Grid>

          {/* Filtro por tipo */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={tipoFilter}
                onChange={handleTipoFilterChange}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={TipoCliente.PF}>Pessoa Física</MenuItem>
                <MenuItem value={TipoCliente.PJ}>Pessoa Jurídica</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por status */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Botões de ação */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/clients/new')}
                disabled={isLoading}
              >
                Novo Cliente
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabela de clientes */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {cliente.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.tipo === TipoCliente.PF ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        size="small"
                        color={cliente.tipo === TipoCliente.PF ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatDocument(cliente.cnpjCpf, cliente.tipo)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatPhone(cliente.telefone)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.ativo ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={cliente.ativo ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Editar cliente">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/clients/${cliente.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deletar cliente">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(cliente)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              disabled={isLoading}
            />
          </Box>
        )}

        {/* Informações da paginação */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {clientes.length} de {pagination.total} clientes
          </Typography>
        </Box>
      </Paper>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Tem certeza que deseja excluir o cliente{' '}
            <strong>{deleteDialog.cliente?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}