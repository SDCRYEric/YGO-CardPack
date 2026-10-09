// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CardPreviewProvider } from './components/CardPreviewProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CardPreviewProvider>
      <App />
    </CardPreviewProvider>
  </React.StrictMode>,
)