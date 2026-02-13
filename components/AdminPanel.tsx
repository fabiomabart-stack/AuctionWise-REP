
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('auctionwise_users');
    if (saved) setUsers(JSON.parse(saved));
  }, []);

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId && u.id !== currentUser.id) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('auctionwise_users', JSON.stringify(updatedUsers));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Gerenciamento de Usuários</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Painel Administrativo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-slate-400 uppercase border-b">
                <th className="pb-4 px-4">Usuário</th>
                <th className="pb-4 px-4">E-mail</th>
                <th className="pb-4 px-4">Status</th>
                <th className="pb-4 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="text-sm">
                  <td className="py-4 px-4 font-bold text-slate-900">{u.username} {u.isAdmin && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Admin</span>}</td>
                  <td className="py-4 px-4 text-slate-500">{u.email}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className={u.isActive ? 'text-emerald-600' : 'text-rose-600'}>{u.isActive ? 'Ativo' : 'Bloqueado'}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${u.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                        {u.isActive ? 'Bloquear' : 'Ativar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button onClick={onClose} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Fechar Painel</button>
        </div>
      </div>
    </div>
  );
};
