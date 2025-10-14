import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inventory2Outlined } from '@mui/icons-material';

const EmptyState = ({ 
  icon: Icon = Inventory2Outlined, 
  title = 'No items found',
  message = 'Try adjusting your filters or search criteria',
  actionLabel,
  onAction
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      textAlign="center"
      gap={2}
    >
      <Icon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
      <Typography variant="h5" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth="400px">
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
