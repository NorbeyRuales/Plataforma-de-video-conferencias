import { jsx as _jsx } from "react/jsx-runtime";
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
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }) }));
