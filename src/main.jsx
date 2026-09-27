import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { daftarkanServiceWorker } from './lib/pwa'
import './index.css'
import './planner-theme.css'
import './brand-refresh.css'
import './creative-experience.css'
import './landing-polish.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

daftarkanServiceWorker()
