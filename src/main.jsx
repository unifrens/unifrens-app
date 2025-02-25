import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import MintPage from './components/MintPage'
import LogsPage from './components/LogsPage'
import FrensPage from './components/FrensPage'
import './styles.css'
import './wallet'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/mint', element: <MintPage /> },
  { path: '/logs', element: <LogsPage /> },
  { path: '/frens', element: <FrensPage /> }
])

// Error handling for production
const handleError = (error) => {
  console.error('Application Error:', error);
  // You might want to add error reporting service here
};

window.addEventListener('error', handleError);
window.addEventListener('unhandledrejection', handleError);

const root = createRoot(document.getElementById('root'));

try {
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
} catch (error) {
  handleError(error);
}
