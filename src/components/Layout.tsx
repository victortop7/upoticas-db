import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BuscaGlobal from './BuscaGlobal';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        background: 'var(--bg)',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
      <BuscaGlobal />
    </div>
  );
}
