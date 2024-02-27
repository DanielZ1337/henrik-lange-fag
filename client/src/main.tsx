import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const LazyApp = React.lazy(() => import('./App.tsx'))

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LazyApp/>
    </React.StrictMode>,
)
