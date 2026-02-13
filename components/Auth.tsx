
import React, { useState } from 'react';
import { User } from '../types';
import { Logo } from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const getUsers = (): User[] => {
    const saved = localStorage.getItem('auctionwise_users');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('auctionwise_users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        setError('E-mail ou senha incorretos.');
        return;
      }
      if (!user.isActive) {
        setError('Sua conta foi desativada pelo administrador.');
        return;
      }
      onLogin(user);
    } else {
      if (users.find(u => u.email === email)) {
        setError('E-mail já cadastrado.');
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        email,
        username,
        password,
        isActive: true, // Acesso imediato
        isAdmin: users.length === 0, // Primeiro usuário vira admin
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, newUser]);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 text-slate-900 mb-4" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AuctionWise</h1>
          <p className="text-slate-500 text-sm">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta profissional'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome de Usuário</label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border-slate-200 border py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: joaosilva"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-slate-200 border py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-slate-200 border py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg mt-4"
          >
            {isLogin ? 'Entrar' : 'Começar Agora'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isLogin ? 'Ainda não tem conta? Increva-se' : 'Já possui conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};
