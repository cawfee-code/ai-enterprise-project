import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx' // 1. Import the provider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>  {/* 2. Wrap the App */}
      <App />
    </AuthProvider>
  </StrictMode>,
)