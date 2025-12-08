import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Wrench, ClipboardList, LogOut, FileText, BarChart3, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { logout } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/inventory', icon: <Package size={20} />, label: 'Estoque' },
    { to: '/clients', icon: <Users size={20} />, label: 'Clientes' },
    { to: '/orders', icon: <Wrench size={20} />, label: 'Ordens de Serviço' },
    { to: '/quotes', icon: <FileText size={20} />, label: 'Orçamentos' },
    { to: '/reports', icon: <BarChart3 size={20} />, label: 'Relatórios' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay Backdrop for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        <div className="p-6 border-b border-slate-700 flex flex-col items-center gap-3">
          <img src="/mci-logo.png" alt="MCI Logo" className="h-12 w-auto object-contain" />
          <div className="text-center">
            <h1 className="font-bold text-lg tracking-wide">ASSISTÊNCIA</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Técnica</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;