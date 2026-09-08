import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../lib/theme';
import { ToastProvider } from '../ui';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
