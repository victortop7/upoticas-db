import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import OrdensServico from './pages/OrdensServico';
import Vendas from './pages/Vendas';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import ImprimirOS from './pages/ImprimirOS';
import Landing from './pages/Landing';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/os/:id/imprimir" element={<ImprimirOS />} />
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/os" element={<OrdensServico />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
