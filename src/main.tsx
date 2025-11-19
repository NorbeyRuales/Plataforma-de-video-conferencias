/**
 * Entry point for the VideoMeet frontend.
 * GUI-only for now (no real backend calls yet).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.scss';
import { ToastProvider } from './components/layout/ToastProvider';

/**
 * Mount the React application using React 18's concurrent root API.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
