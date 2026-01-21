import React, { useState } from 'react';
import { Logo } from './Logo';
import { Loader2, Lock } from 'lucide-react';
import { AppConfig } from '../lib/app_config';

export function LoginPage({ supabase }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // O redirecionamento ou mudança de estado será tratado no App.jsx via onAuthStateChange
        } catch (err) {
            setError(err.message === "Invalid login credentials" ? "Email ou senha incorretos." : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: 'admin@admin.com',
                password: 'admin123456',
            });
            if (error) throw error;
            alert("Usuário criado! Use admin@admin.com / admin123456");
            setEmail('admin@admin.com');
            setPassword('admin123456');
        } catch (err) {
            alert("Erro ao criar: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans animate-fade-in relative"
            style={{
                backgroundImage: `url('/login-bg.png')`
            }}
        >
            {/* Dark Overlay for Readability */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 animate-slide-in px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 max-w-sm ${notification.type === 'success' ? 'bg-[#1a1a1a] border-[#C9A857]/50 text-[#C9A857]' : 'bg-[#1a1a1a] border-red-500/50 text-red-400'}`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-[#C9A857]/10' : 'bg-red-900/20'}`}>
                        {notification.type === 'success' ? <Lock size={16} /> : <Loader2 size={16} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">{notification.type === 'success' ? 'Sucesso' : 'Atenção'}</h4>
                        <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-auto text-gray-500 hover:text-white">✕</button>
                </div>
            )}

            <div className="w-full max-w-md bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#C9A857]/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 transition-all hover:border-[#C9A857]/50 hover:shadow-[0_0_60px_rgba(201,168,87,0.1)]">
                <div className="flex justify-center mb-8 scale-110">
                    <Logo size="medium" />
                </div>

                <h2 className="text-xl text-white font-serif text-center mb-6 flex items-center justify-center gap-2 tracking-widest uppercase text-xs font-bold opacity-80">
                    <Lock size={14} className="text-[#C9A857]" /> Acesso Restrito
                </h2>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-3 rounded mb-4 text-center animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="group">
                        <label className="block text-[#C9A857] text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 transition-colors group-focus-within:text-white">Email Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#111]/80 border border-[#333] text-white px-4 py-3.5 rounded-xl focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] outline-none transition-all placeholder-gray-700"
                            placeholder="usuario@escritorio.com"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[#C9A857] text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 transition-colors group-focus-within:text-white">Senha de Acesso</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111]/80 border border-[#333] text-white px-4 py-3.5 rounded-xl focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] outline-none transition-all placeholder-gray-700"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                if (!email) {
                                    setNotification({ type: 'error', message: "Digite seu e-mail para recuperar a senha." });
                                    setTimeout(() => setNotification(null), 4000);
                                    return;
                                }
                                setLoading(true);
                                try {
                                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                        redirectTo: window.location.origin + '/update-password',
                                    });
                                    if (error) throw error;
                                    setNotification({ type: 'success', message: "Link enviado para " + email });
                                    setTimeout(() => setNotification(null), 6000);
                                } catch (err) {
                                    setNotification({ type: 'error', message: err.message });
                                    setTimeout(() => setNotification(null), 4000);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="text-[10px] text-gray-500 hover:text-[#C9A857] mt-3 block text-right transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#C9A857] to-[#b08d40] text-[#111] py-4 rounded-xl font-bold uppercase tracking-widest text-sm mt-6 flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#C9A857]/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Acessar Painel"}
                    </button>
                </form>
            </div>

            {/* Legal Footer */}
            <div className="absolute bottom-6 text-center w-full z-10 opacity-40 pointer-events-none">
                <p className="text-[10px] text-white uppercase tracking-[0.3em] font-light">
                    {AppConfig.officeName} &bull; Protegido por Criptografia SSL &bull; © 2026
                </p>
            </div>
        </div>
    );
}
