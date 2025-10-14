import React from 'react';
import { Alert, Box } from '@mui/material';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <button onClick={onRetry} style={{ cursor: 'pointer' }}>
              Retry
            </button>
          )
        }
      >
        {message || 'Something went wrong. Please try again.'}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
