// main.jsx — Vite entry point
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { pergaminhoTheme } from './theme.js';
import './data/database_extra.js';
import Game from './app.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './style.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={pergaminhoTheme}>
    <CssBaseline />
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  </ThemeProvider>
);
