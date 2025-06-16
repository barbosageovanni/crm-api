import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const UserProfile: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Perfil do Usuário
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Perfil do usuário em desenvolvimento...
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserProfile;