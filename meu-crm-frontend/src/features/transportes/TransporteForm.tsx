// src/features/transportes/TransporteForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// MUI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';

// MUI Icons
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Services and Types
import transporteService from './transporteServiceFrontend';
import { CreateTransporteDTO, UpdateTransporteDTO, TransporteDTO } from './transporteDtosFrontend';
import clienteService from '../clients/clientService';
import { ClienteDTO } from '../clients/clientService';

export default function TransporteForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new';
  
  // Estados para o formulário
  const [formData, setFormData] = useState<CreateTransporteDTO>({
    clienteId: 0,
    numeroCteOc: '',
    dataOperacao: '',
    valorTotal: 0,
    placaVeiculo: '',  // Campo adicionado
    fatura: '',        // Campo adicionado
    valorFrete: 0,
    observacoes: '',
    dataColeta: '',
    dataEnvioFaturamento: '',
    dataVencimento: '',
    dataAtesto: '',
    dataNotaFiscal: '',
    descricaoNotaFiscal: '',
    status: 'PENDENTE'
  });
  
  // Estados para controle de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para lista de clientes
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Carregar clientes para o select
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true);
      try {
        const response = await clienteService.getClientes(1, 1000, { ativo: true });
        setClientes(response.data);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setError('Não foi possível carregar a lista de clientes. Tente novamente mais tarde.');
      } finally {
        setLoadingClientes(false);
      }
    };
    
    fetchClientes();
  }, []);
  
  // Carregar dados do transporte se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && id) {
      const fetchTransporte = async () => {
        setLoading(true);
        try {
          const transporte = await transporteService.getTransporteById(parseInt(id));
          
          // Formatar datas para o formato esperado pelo input type="date"
          const formatDateForInput = (dateString?: string) => {
            if (!dateString) return '';
            return dateString.split('T')[0]; // Pega apenas a parte da data (YYYY-MM-DD)
          };
          
          setFormData({
            clienteId: transporte.clienteId,
            numeroCteOc: transporte.numeroCteOc,
            dataOperacao: formatDateForInput(transporte.dataOperacao),
            valorTotal: transporte.valorTotal,
            placaVeiculo: transporte.placaVeiculo || '',  // Campo adicionado
            fatura: transporte.fatura || '',              // Campo adicionado
            valorFrete: transporte.valorFrete || 0,
            observacoes: transporte.observacoes || '',
            dataColeta: formatDateForInput(transporte.dataColeta),
            dataEnvioFaturamento: formatDateForInput(transporte.dataEnvioFaturamento),
            dataVencimento: formatDateForInput(transporte.dataVencimento),
            dataAtesto: formatDateForInput(transporte.dataAtesto),
            dataNotaFiscal: formatDateForInput(transporte.dataNotaFiscal),
            descricaoNotaFiscal: transporte.descricaoNotaFiscal || '',
            status: transporte.status || 'PENDENTE'
          });
        } catch (error) {
          console.error('Erro ao carregar transporte:', error);
          setError('Não foi possível carregar os dados do transporte. Tente novamente mais tarde.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchTransporte();
    }
  }, [isEditMode, id]);
  
  // Manipuladores de eventos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.clienteId || !formData.numeroCteOc || !formData.dataOperacao || !formData.valorTotal || formData.valorTotal <= 0) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isEditMode && id) {
        // Modo de edição
        await transporteService.updateTransporte(parseInt(id), formData as UpdateTransporteDTO);
        setSuccess('Transporte atualizado com sucesso!');
      } else {
        // Modo de criação
        await transporteService.createTransporte(formData as CreateTransporteDTO);
        setSuccess('Transporte criado com sucesso!');
        
        // Limpar formulário após criação bem-sucedida
        if (!isEditMode) {
          setFormData({
            clienteId: 0,
            numeroCteOc: '',
            dataOperacao: '',
            valorTotal: 0,
            placaVeiculo: '',  // Campo adicionado
            fatura: '',        // Campo adicionado
            valorFrete: 0,
            observacoes: '',
            dataColeta: '',
            dataEnvioFaturamento: '',
            dataVencimento: '',
            dataAtesto: '',
            dataNotaFiscal: '',
            descricaoNotaFiscal: '',
            status: 'PENDENTE'
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar transporte:', error);
      setError(error.message || 'Não foi possível salvar o transporte. Tente novamente mais tarde.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    navigate('/transportes');
  };
  
  // Renderização condicional durante carregamento
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Dashboard
        </Link>
        <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/transportes'); }}>
          Transportes
        </Link>
        <Typography color="text.primary">{isEditMode ? 'Editar Transporte' : 'Novo Transporte'}</Typography>
      </Breadcrumbs>
      
      {/* Título */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Editar Transporte' : 'Novo Transporte'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Voltar
        </Button>
      </Box>
      
      {/* Mensagens de erro e sucesso */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Formulário */}
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informações básicas */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="cliente-select-label">Cliente</InputLabel>
                <Select
                  labelId="cliente-select-label"
                  id="clienteId"
                  name="clienteId"
                  value={formData.clienteId || ''}
                  onChange={handleSelectChange}
                  label="Cliente"
                  disabled={loadingClientes || saving}
                >
                  <MenuItem value={0} disabled>Selecione um cliente</MenuItem>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                id="numeroCteOc"
                name="numeroCteOc"
                label="Número CTE/OC"
                value={formData.numeroCteOc}
                onChange={handleChange}
                disabled={saving}
                error={!formData.numeroCteOc}
                helperText={!formData.numeroCteOc ? 'Campo obrigatório' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                id="dataOperacao"
                name="dataOperacao"
                label="Data da Operação"
                type="date"
                value={formData.dataOperacao}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                error={!formData.dataOperacao}
                helperText={!formData.dataOperacao ? 'Campo obrigatório' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                id="valorTotal"
                name="valorTotal"
                label="Valor Total"
                type="number"
                value={formData.valorTotal}
                onChange={handleChange}
                disabled={saving}
                error={formData.valorTotal <= 0}
                helperText={formData.valorTotal <= 0 ? 'Valor deve ser maior que zero' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Campos adicionados: placaVeiculo e fatura */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="placaVeiculo"
                name="placaVeiculo"
                label="Placa do Veículo"
                value={formData.placaVeiculo || ''}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsCarIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="fatura"
                name="fatura"
                label="Número da Fatura"
                value={formData.fatura || ''}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ReceiptIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="valorFrete"
                name="valorFrete"
                label="Valor do Frete"
                type="number"
                value={formData.valorFrete || 0}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="dataColeta"
                name="dataColeta"
                label="Data de Coleta"
                type="date"
                value={formData.dataColeta || ''}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Informações de Faturamento
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="dataEnvioFaturamento"
                name="dataEnvioFaturamento"
                label="Data de Envio para Faturamento"
                type="date"
                value={formData.dataEnvioFaturamento || ''}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="dataVencimento"
                name="dataVencimento"
                label="Data de Vencimento"
                type="date"
                value={formData.dataVencimento || ''}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Informações de Atesto e Nota Fiscal
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="dataAtesto"
                name="dataAtesto"
                label="Data de Atesto"
                type="date"
                value={formData.dataAtesto || ''}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="dataNotaFiscal"
                name="dataNotaFiscal"
                label="Data da Nota Fiscal"
                type="date"
                value={formData.dataNotaFiscal || ''}
                onChange={handleChange}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="descricaoNotaFiscal"
                name="descricaoNotaFiscal"
                label="Descrição da Nota Fiscal"
                multiline
                rows={3}
                value={formData.descricaoNotaFiscal || ''}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="observacoes"
                name="observacoes"
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes || ''}
                onChange={handleChange}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Botões de ação */}
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ mr: 2 }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
