import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { Toaster } from 'dynaura' 
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataProvider>
      <Toaster /> 
      <App />
    </DataProvider>
  </React.StrictMode>,
)