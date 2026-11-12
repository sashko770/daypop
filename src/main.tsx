import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for offline support and Android WebAPK
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

