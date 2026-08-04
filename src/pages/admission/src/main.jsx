import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import TopLoadingBar from './components/TopLoadingBar';
import App from './App.jsx';
import './index.css';

console.log("MAIN.JSX: IMPORTS COMPLETED");

const rootElement = document.getElementById('root');
console.log("MAIN.JSX: ROOT ELEMENT:", rootElement);

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    console.log("MAIN.JSX: ROOT CREATED");
    root.render(
      <StrictMode>
        <BrowserRouter>
          <LoadingProvider>
            <AuthProvider>
              <TopLoadingBar />
              <App />
              <Toaster position="top-right" />
            </AuthProvider>
          </LoadingProvider>
        </BrowserRouter>
      </StrictMode>
    );
    console.log("MAIN.JSX: RENDER CALLED");
  } catch (err) {
    console.error("MAIN.JSX: CRITICAL ERROR:", err);
  }
} else {
  console.error("MAIN.JSX: ROOT NOT FOUND");
}
