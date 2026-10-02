import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialData } from '../data/mockData';

/* ── Toast Context ─────────────────────────── */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

/* ── Data Context ──────────────────────────── */
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

/* ── Toast Renderer ────────────────────────── */
function Toasts({ toasts }) {
  return (
    <div className="g-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`g-toast g-toast-${t.type}`}>
          <div className="g-toast-dot" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Background Atmosphere ─────────────────── */
function AppBackground() {
  return (
    <div className="app-bg" aria-hidden="true">
      <div className="app-orb" style={{
        top: '-10%', left: '20%',
        width: '40%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(139,148,255,0.22) 0%, transparent 70%)',
      }} />
      <div className="app-orb" style={{
        top: '30%', right: '-5%',
        width: '35%', height: '35%',
        background: 'radial-gradient(ellipse, rgba(167,210,255,0.18) 0%, transparent 70%)',
      }} />
      <div className="app-orb" style={{
        bottom: '5%', left: '10%',
        width: '30%', height: '30%',
        background: 'radial-gradient(ellipse, rgba(196,167,253,0.14) 0%, transparent 70%)',
      }} />
    </div>
  );
}

/* ── Provider ──────────────────────────────── */
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('hw_app_data_v3');
      return saved ? JSON.parse(saved) : initialData;
    } catch { return initialData; }
  });

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('hw_app_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    localStorage.setItem('hw_app_data_v3', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (session) localStorage.setItem('hw_app_session', JSON.stringify(session));
    else localStorage.removeItem('hw_app_session');
  }, [session]);

  const login  = (role, user) => setSession({ role, user });
  const logout = () => setSession(null);

  return (
    <DataContext.Provider value={{ data, setData, session, login, logout }}>
      <ToastContext.Provider value={addToast}>
        <AppBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          {children}
        </div>
        <Toasts toasts={toasts} />
      </ToastContext.Provider>
    </DataContext.Provider>
  );
};
