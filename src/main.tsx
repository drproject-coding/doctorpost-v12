import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; // Ensure this is the only main CSS import
import { GoogleOAuthProvider } from '@react-oauth/google'; // Import GoogleOAuthProvider

// Get Google Client ID from environment variables (or a config file)
// In a real app, this would be loaded securely, e.g., from a public env var
const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Explicitly type and use nullish coalescing

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);