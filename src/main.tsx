import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminAuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AdminAuthProvider>
  </StrictMode>,
);

