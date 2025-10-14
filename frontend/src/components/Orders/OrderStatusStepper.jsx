// ==========================================
// frontend/src/components/Orders/OrderStatusStepper.jsx
// ==========================================
import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Restaurant,
  LocalShipping,
  Done,
} from '@mui/icons-material';

const steps = [
  { label: 'Pending', icon: Schedule, status: 'pending' },
  { label: 'Confirmed', icon: CheckCircle, status: 'confirmed' },
  { label: 'Preparing', icon: Restaurant, status: 'preparing' },
  { label: 'Delivering', icon: LocalShipping, status: 'delivering' },
  { label: 'Delivered', icon: Done, status: 'delivered' },
];

const OrderStatusStepper = ({ currentStatus }) => {
  const activeStep = steps.findIndex((step) => step.status === currentStatus);

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Order Status
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <Step key={step.status}>
              <StepLabel icon={<StepIcon />}>{step.label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default OrderStatusStepper;