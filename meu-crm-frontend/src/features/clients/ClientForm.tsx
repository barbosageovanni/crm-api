// src/features/clients/ClientForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientService, { 
  type ClienteDTO, 
  type CreateClienteDTO, 
  type UpdateClienteDTO,
  TipoCliente 
} from './clientService';
import {
  validateClienteForm,
  formatCPF,
  formatCNPJ,
  formatTelefone,
  type ClienteValidationErrors
} from './clientValidation';

// Componentes MUI
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface ClientFormState {
  nome: string;
  tipo: TipoCliente;
  documento: string;
  email: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
}

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Estados do formulário
  const [formData, setFormData] = useState<ClientFormState>({
    nome: '',
    tipo: TipoCliente.PF,
    documento: '',
    email: '',
    telefone: '',
    endereco: '',
    ativo: true,
  });

  const [errors, setErrors] = useState<ClienteValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar dados do cliente se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      loadClientData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadClientData = async (clientId: number) => {
    setIsLoadingData(true);
    try {
      const cliente = await clientService.getClienteById(clientId);
      setFormData({
        nome: cliente.nome,
        tipo: cliente.tipo,
        documento: cliente.cnpjCpf || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        ativo: cliente.ativo,
      });
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao carregar dados do cliente.'
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Manipular mudanças nos campos
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    
    let newValue: string | boolean = type === 'checkbox' ? checked : value;

    // Formatação específica para campos
    if (name === 'documento') {
      const cleanValue = value.replace(/\D/g, '');
      if (formData.tipo === TipoCliente.PF && cleanValue.length <= 11) {
        newValue = formatCPF(cleanValue);
      } else if (formData.tipo === TipoCliente.PJ && cleanValue.length <= 14) {
        newValue = formatCNPJ(cleanValue);
      } else {
        newValue = value; // Mantém o valor original se exceder o limite
      }
    } else if (name === 'telefone') {
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 11) {
        newValue = formatTelefone(cleanValue);
      } else {
        newValue = value; // Mantém o valor original se exceder o limite
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Limpar erro do campo específico
    if (errors[name as keyof ClienteValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setMessage(null);
  };

  // Manipular mudança de tipo de cliente
  const handleTipoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoTipo = event.target.value as TipoCliente;
    setFormData(prev => ({
      ...prev,
      tipo: novoTipo,
      documento: '' // Limpa documento ao mudar tipo
    }));
    
    // Limpar erro do documento
    if (errors.documento) {
      setErrors(prev => ({ ...prev, documento: undefined }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const validationErrors = validateClienteForm({
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      documento: formData.documento,
      tipo: formData.tipo,
    });

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && id) {
        // Atualizar cliente existente
        const updateData: UpdateClienteDTO = {
          nome: formData.nome,
          tipo: formData.tipo,
          cnpjCpf: formData.documento || undefined,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          endereco: formData.endereco || undefined,
          ativo: formData.ativo,
        };

        await clientService.updateCliente(parseInt(id), updateData);
        setMessage({
          type: 'success',
          text: 'Cliente atualizado com sucesso!'
        });
      } else {
        // Criar novo cliente
        const createData: CreateClienteDTO = {
          nome: formData.nome,
          tipo: formData.tipo,
          cnpjCpf: formData.documento || undefined,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          endereco: formData.endereco || undefined,
          ativo: formData.ativo,
        };

        await clientService.createCliente(createData);
        setMessage({
          type: 'success',
          text: 'Cliente criado com sucesso!'
        });
      }

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/clients');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      
      const errorMessage = error.response?.data?.message ||
                           error.message ||
                           'Erro ao salvar cliente. Verifique os dados e tente novamente.';

      // Tratar erros específicos do backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const backendErrors = error.response.data.errors.reduce((acc: any, errorItem: any) => {
          if (errorItem.path) acc[errorItem.path] = errorItem.msg;
          return acc;
        }, {});
        
        setErrors(prev => ({ ...prev, ...backendErrors }));
        
        if (!Object.keys(backendErrors).length) {
          setMessage({ type: 'error', text: errorMessage });
        }
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/clients')}
            variant="outlined"
          >
            Voltar
          </Button>
          <Typography variant="h4" component="h1">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Nome */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="nome"
                label="Nome Completo"
                value={formData.nome}
                onChange={handleInputChange}
                error={!!errors.nome}
                helperText={errors.nome}
                disabled={isLoading}
              />
            </Grid>

            {/* Tipo de Cliente */}
            <Grid item xs={12}>
              <FormControl component="fieldset" disabled={isLoading}>
                <FormLabel component="legend">Tipo de Cliente</FormLabel>
                <RadioGroup
                  row
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleTipoChange}
                >
                  <FormControlLabel
                    value={TipoCliente.PF}
                    control={<Radio />}
                    label="Pessoa Física"
                  />
                  <FormControlLabel
                    value={TipoCliente.PJ}
                    control={<Radio />}
                    label="Pessoa Jurídica"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Documento (CPF/CNPJ) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="documento"
                label={formData.tipo === TipoCliente.PF ? 'CPF' : 'CNPJ'}
                value={formData.documento}
                onChange={handleInputChange}
                error={!!errors.documento}
                helperText={errors.documento}
                disabled={isLoading}
                placeholder={
                  formData.tipo === TipoCliente.PF 
                    ? '000.000.000-00' 
                    : '00.000.000/0000-00'
                }
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
              />
            </Grid>

            {/* Telefone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="telefone"
                label="Telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                error={!!errors.telefone}
                helperText={errors.telefone}
                disabled={isLoading}
                placeholder="(00) 00000-0000"
              />
            </Grid>

            {/* Status Ativo */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={handleInputChange}
                    name="ativo"
                    disabled={isLoading}
                  />
                }
                label="Cliente Ativo"
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="endereco"
                label="Endereço"
                multiline
                rows={3}
                value={formData.endereco}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </Grid>
          </Grid>

          {/* Botões */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/clients')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={isLoading}
            >
              {isLoading 
                ? (isEditing ? 'Atualizando...' : 'Salvando...') 
                : (isEditing ? 'Atualizar' : 'Salvar')
              }
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}