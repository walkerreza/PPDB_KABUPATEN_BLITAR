import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from "@material-tailwind/react";
import './index.css';
import router from './routes/router.jsx';
import { initializePerformanceMonitoring } from './utils/performanceMonitor';

// Initialize performance monitoring
initializePerformanceMonitoring();

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
} else {
  console.error('Root element not found');
}
