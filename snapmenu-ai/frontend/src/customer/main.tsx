import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import '../index.css';
import { MenuPage } from './MenuPage';
import { TrackPage } from './TrackPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/r/:slug/t/:token" element={<MenuPage />} />
        <Route path="/r/:slug" element={<MenuPage />} />
        <Route path="/track/:token" element={<TrackPage />} />
        <Route path="*" element={<Navigate to="/r/demo-bistro" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
