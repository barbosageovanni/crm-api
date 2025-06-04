import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../features/users/userService';
import type {
  UserDTO,
  UserFilterParams
} from '../../features/users/userDtos';
import { PapelUsuario } from '../../features/users/userDtos';

// Componentes MUI
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// Ícones
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import KeyIcon from '@mui/icons-material/Key';

export default function UserListPage() {
  const navigate = useNavigate();

  // Estados para paginação e filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilterParams>({});

  // Estados para carregamento e erros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para diálogo de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Carregar usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUsers({
        ...filters,
        nome: searchTerm || undefined
      });
      setUsers(response.items);
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError('Não foi possível carregar a lista de usuários. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar usuários quando a página, linhas por página ou filtros mudarem
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters]);

  // Manipuladores de eventos
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
    setFilters({});
    fetchUsers();
  };

  const handleFilterChange = (field: keyof UserFilterParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  // Manipuladores para diálogo de exclusão
  const handleOpenDeleteDialog = (user: UserDTO) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);

    try {
      await userService.deleteUser(userToDelete.id);
      fetchUsers(); // Recarregar lista após exclusão
      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError('Não foi possível excluir o usuário. Tente novamente mais tarde.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Renderizar chip de papel do usuário
  const renderPapelChip = (papel: PapelUsuario) => {
    let color: 'primary' | 'secondary' | 'success' | 'default';

    switch (papel) {
      case PapelUsuario.ADMIN:
        color = 'primary';
        break;
      case PapelUsuario.GERENTE:
        color = 'secondary';
        break;
      case PapelUsuario.USUARIO:
        color = 'success';
        break;
      default:
        color = 'default';
    }

    return (
      <Chip
        label={papel}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Renderizar chip de status
  const renderStatusChip = (ativo: boolean) => (
    <Chip
      label={ativo ? 'Ativo' : 'Inativo'}
      color={ativo ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Usuários
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/users/new')}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="papel-filter-label">Papel</InputLabel>
            <Select
              labelId="papel-filter-label"
              value={filters.papel || ''}
              onChange={(e) => handleFilterChange('papel', e.target.value || undefined)}
              label="Papel"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={PapelUsuario.ADMIN}>Admin</MenuItem>
              <MenuItem value={PapelUsuario.GERENTE}>Gerente</MenuItem>
              <MenuItem value={PapelUsuario.USUARIO}>Usuário</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filters.ativo === undefined ? '' : filters.ativo ? 'ativo' : 'inativo'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleFilterChange('ativo', undefined);
                } else {
                  handleFilterChange('ativo', value === 'ativo');
                }
              }}
              label="Status"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ativo">Ativo</MenuItem>
              <MenuItem value="inativo">Inativo</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleSearch}
              size="small"
            >
              Filtrar
            </Button>
            <Button
              variant="text"
              onClick={handleClearSearch}
              size="small"
            >
              Limpar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabela de usuários */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de usuários">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Cadastro</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum usuário encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {user.nome}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{renderPapelChip(user.papel)}</TableCell>
                    <TableCell>{renderStatusChip(user.ativo)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => navigate(`/users/${user.id}/reset-password`)}
                        >
                          <KeyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir o usuário <strong>{userToDelete?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : undefined}
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}