import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-8">
      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-2">
            <img src="/mci-logo.png" alt="MCI Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">ASSISTÊNCIA TÉCNICA</h1>
          <p className="text-slate-400 text-sm">Faça login para acessar o sistema</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

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
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Não tem acesso? <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">Criar conta</Link>
        </div>
      </div>

      <footer className="mt-8 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} MCI. Todos os direitos reservados.</p>
        <p className="mt-1">Desenvolvido por <span className="font-semibold text-emerald-500">Paulinho Fernando</span></p>
      </footer>
    </div>
  );
};

export default Login;