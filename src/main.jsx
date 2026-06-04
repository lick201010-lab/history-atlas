import React from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import './styles.atlas.css';
import './styles-mobile.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
