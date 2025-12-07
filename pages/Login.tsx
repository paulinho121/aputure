import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 flex items-center justify-center mb-2">
            <img src="/mci-logo.png" alt="MCI Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ASSISTÊNCIA TÉCNICA</h1>
          <p className="text-slate-400 text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              placeholder="tecnico@mci.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline">Esqueceu a senha?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Não tem acesso? <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium">Solicite registro</a>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} MCI. Todos os direitos reservados.</p>
        <p>Desenvolvido por <span className="font-semibold text-emerald-500">Paulinho Fernando</span></p>
      </footer>
    </div>
  );
};

export default Login;