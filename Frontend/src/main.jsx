import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { Toaster } from 'dynaura' // <-- Mount exactly ONE here at the root
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataProvider>
      <Toaster /> {/* Mounts safely above all CSS layout constraints */}
      <App />
    </DataProvider>
  </React.StrictMode>,
)