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
import Vendedores from './pages/Vendedores';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import ImprimirOS from './pages/ImprimirOS';
import Landing from './pages/Landing';
import Contas from './pages/financeiro/Contas';
import Funil from './pages/crm/Funil';
import Campanhas from './pages/marketing/Campanhas';
import Modelos from './pages/marketing/Modelos';
import Aniversariantes from './pages/marketing/Aniversariantes';
import Historico from './pages/marketing/Historico';
import ContasPagar from './pages/financeiro/ContasPagar';
import ContasReceber from './pages/financeiro/ContasReceber';
import Caixa from './pages/financeiro/Caixa';
import FluxoFinanceiro from './pages/financeiro/FluxoFinanceiro';

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
            <Route path="/vendedores" element={<Vendedores />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/financeiro/contas" element={<Contas />} />
            <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
            <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
            <Route path="/financeiro/caixa" element={<Caixa />} />
            <Route path="/financeiro/fluxo" element={<FluxoFinanceiro />} />
            <Route path="/crm" element={<Funil />} />
            <Route path="/marketing/campanhas" element={<Campanhas />} />
            <Route path="/marketing/modelos" element={<Modelos />} />
            <Route path="/marketing/aniversariantes" element={<Aniversariantes />} />
            <Route path="/marketing/historico" element={<Historico />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
