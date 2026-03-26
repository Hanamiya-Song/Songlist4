import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
// index.css を消す（またはimportしない）

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)