import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import AvatarPage from './components/AvatarPage'
import MintPage from './components/MintPage'
import LogsPage from './components/LogsPage'
import FrensPage from './components/FrensPage'
import Avatar from 'boring-avatars'
import './styles.css'
import './wallet'

const RawAvatarPage = ({ params }) => {
  // Clear any existing content
  document.documentElement.innerHTML = ''
  
  // Create and render the avatar directly
  const avatar = new Avatar({
    size: 400,
    name: params.seed,
    variant: 'beam',
    colors: ['#F50DB4', '#FEAFF0'],
    square: true
  })
  
  // Get the SVG string
  const svgString = avatar.toString()
  
  // Set content type to SVG
  document.contentType = 'image/svg+xml'
  
  // Write the SVG directly to the document
  document.write(svgString)
  document.close()
  
  return null
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/imgs/:seed', element: <AvatarPage /> },
  { path: '/img/:seed', element: <RawAvatarPage /> },
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
  console.error('Render Error:', error);
  // Fallback UI in case of critical error
  root.render(
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'system-ui' 
    }}>
      <h1>Something went wrong</h1>
      <p>Please refresh the page or try again later.</p>
    </div>
  );
}
