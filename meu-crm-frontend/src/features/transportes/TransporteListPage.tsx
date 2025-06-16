// src/features/transportes/TransporteListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// MUI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';

// Services and Types
import transporteService from './transporteServiceFrontend';
import { TransporteDTO, TransporteFilters, PaginationOptions } from './transporteDtosFrontend';
import clienteService, { ClienteDTO } from '../clients/clientService';

export default function TransporteListPage() {
  const navigate = useNavigate();
  
  // Estados para dados e paginação
  const [transportes, setTransportes] = useState<TransporteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados para filtros
  const [search, setSearch] = useState('');
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Estado para exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transporteToDelete, setTransporteToDelete] = useState<TransporteDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Carregar clientes para o filtro
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true);
      try {
        const response = await clienteService.getClientes(1, 1000, { ativo: true });
        setClientes(response.data);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoadingClientes(false);
      }
    };
    
    fetchClientes();
  }, []);
  
  // Carregar transportes
  const fetchTransportes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Preparar parâmetros baseado na assinatura do método
      const params: { clienteId?: number; ativo?: boolean } = {};
      if (clienteId !== '') params.clienteId = clienteId as number;
      params.ativo = true; // assumindo que queremos apenas transportes ativos
      
      const response = await transporteService.getAllTransportes(params);
      setTransportes(response.data);
      setTotalItems(response.data.length);
    } catch (error) {
      console.error('Erro ao carregar transportes:', error);
      setError('Não foi possível carregar os transportes. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar transportes quando os filtros ou paginação mudarem
  useEffect(() => {
    fetchTransportes();
  }, [page, rowsPerPage, clienteId, dateFrom, dateTo]);
  
  // Manipuladores de eventos
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };
  
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0); // Resetar para a primeira página
    fetchTransportes();
  };
  
  const handleClearSearch = () => {
    setSearch('');
    setPage(0);
    fetchTransportes();
  };
  
  const handleClienteChange = (event: SelectChangeEvent<number | ''>) => {
    setClienteId(event.target.value as number | '');
    setPage(0);
  };
  
  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(event.target.value);
    setPage(0);
  };
  
  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(event.target.value);
    setPage(0);
  };
  
  const handleClearFilters = () => {
    setClienteId('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };
  
  const handleAddTransporte = () => {
    navigate('/transportes/new');
  };
  
  const handleEditTransporte = (id: number) => {
    navigate(`/transportes/${id}/edit`);
  };
  
  const handleDeleteClick = (transporte: TransporteDTO) => {
    setTransporteToDelete(transporte);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!transporteToDelete) return;
    
    setDeleteLoading(true);
    try {
      await transporteService.deleteTransporte(transporteToDelete.id);
      setDeleteDialogOpen(false);
      setTransporteToDelete(null);
      fetchTransportes(); // Recarregar a lista
    } catch (error) {
      console.error('Erro ao excluir transporte:', error);
      setError('Não foi possível excluir o transporte. Tente novamente mais tarde.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTransporteToDelete(null);
  };
  
  // Formatadores
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transportes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddTransporte}
        >
          Novo Transporte
        </Button>
      </Box>
      
      {/* Barra de pesquisa */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por número CTE/OC ou descrição..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ ml: 2 }}
          >
            Buscar
          </Button>
          <Tooltip title="Filtros avançados">
            <IconButton 
              color={showFilters || clienteId || dateFrom || dateTo ? "primary" : "default"}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ ml: 1 }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Filtros avançados */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="cliente-select-label">Cliente</InputLabel>
                  <Select
                    labelId="cliente-select-label"
                    id="cliente-select"
                    value={clienteId}
                    onChange={handleClienteChange}
                    label="Cliente"
                    disabled={loadingClientes}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  id="date-from"
                  label="Data inicial"
                  type="date"
                  size="small"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  id="date-to"
                  label="Data final"
                  type="date"
                  size="small"
                  value={dateTo}
                  onChange={handleDateToChange}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  variant="outlined" 
                  onClick={handleClearFilters}
                  fullWidth
                  disabled={!clienteId && !dateFrom && !dateTo}
                >
                  Limpar Filtros
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Chips de filtros ativos */}
        {(clienteId || dateFrom || dateTo) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {clienteId && (
              <Chip 
                label={`Cliente: ${clientes.find(c => c.id === clienteId)?.nome || clienteId}`} 
                onDelete={() => setClienteId('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {dateFrom && (
              <Chip 
                label={`A partir de: ${formatDate(dateFrom)}`} 
                onDelete={() => setDateFrom('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {dateTo && (
              <Chip 
                label={`Até: ${formatDate(dateTo)}`} 
                onDelete={() => setDateTo('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>
      
      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabela de transportes */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número CTE/OC</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Data da Operação</TableCell>
                <TableCell>Valor Total</TableCell>
                <TableCell>Data de Vencimento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Nenhum transporte encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                transportes.map((transporte) => (
                  <TableRow key={transporte.id}>
                    <TableCell>{transporte.numeroCteOc}</TableCell>
                    <TableCell>{transporte.cliente?.nome || '-'}</TableCell>
                    <TableCell>{formatDate(transporte.dataOperacao)}</TableCell>
                    <TableCell>{formatCurrency(transporte.valorTotal)}</TableCell>
                    <TableCell>{formatDate(transporte.dataVencimento)}</TableCell>
                    <TableCell>
                      {transporte.dataAtesto ? (
                        <Chip label="Atestado" color="success" size="small" />
                      ) : transporte.dataVencimento && new Date(transporte.dataVencimento) < new Date() ? (
                        <Chip label="Vencido" color="error" size="small" />
                      ) : transporte.dataEnvioFaturamento ? (
                        <Chip label="Faturado" color="primary" size="small" />
                      ) : (
                        <Chip label="Pendente" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditTransporte(transporte.id)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(transporte)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginação */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o transporte <strong>{transporteToDelete?.numeroCteOc}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
