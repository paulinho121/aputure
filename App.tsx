import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import ServiceOrders from './pages/ServiceOrders';
import Quotes from './pages/Quotes';
import Reports from './pages/Reports';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-fade-message {
          animation: fade-in-out 4s ease-in-out infinite;
        }
      `}</style>
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="hidden md:flex justify-center mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-700 via-emerald-500 to-teal-400 bg-clip-text text-transparent animate-fade-message text-center">
            MCI — Centro Oficial de Assistência Técnica Aputure, Amaran, Creamsource e Astera. Qualidade garantida para quem exige o melhor.
          </h2>
        </div>
        {children}

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MCI. Todos os direitos reservados.</p>
          <p className="mt-1">Desenvolvido por <span className="font-semibold text-emerald-600">Paulinho Fernando</span></p>
        </footer>
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useApp();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

const AppContent = () => {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute>
          <ServiceOrders />
        </ProtectedRoute>
      } />

      <Route path="/quotes" element={
        <ProtectedRoute>
          <Quotes />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;