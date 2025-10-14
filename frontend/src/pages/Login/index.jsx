import React from 'react';
import { Container } from '@mui/material';
import LoginForm from '../../components/Auth/LoginForm';

const Login = () => {
  return (
    <Container maxWidth="sm">
      <LoginForm />
    </Container>
  );
};

export default Login;
