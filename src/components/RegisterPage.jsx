import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserPlus, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export function RegisterPage({ supabase }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err) {
            let msg = err.message;
            if (msg.includes("already registered")) msg = "Este e-mail já está cadastrado.";
            if (msg.includes("weak")) msg = "A senha é muito fraca.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#050505] to-[#000000]"></div>
                <div className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-green-500/30 p-10 rounded-2xl shadow-2xl text-center relative z-10 animate-scale-in">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                            <CheckCircle size={40} />
                        </div>
                    </div>
                    <h2 className="text-2xl text-white font-serif font-bold mb-2">Conta Criada!</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Seu cadastro foi realizado com sucesso. Você já pode acessar o sistema.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full btn-gold py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-transform"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative overflow-hidden"
            style={{
                backgroundImage: `url('/login-bg.png')`
            }}
        >
            {/* Dark Overlay for Readability */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>

            <div className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-[#333] p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 animate-fade-in-up">
                <div className="flex justify-center mb-8">
                    <Logo size="medium" />
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-xl text-white font-bold mb-2 flex items-center justify-center gap-2">
                        <UserPlus size={20} className="text-[#C9A857]" /> Cadastro de Equipe
                    </h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">Acesso Exclusivo para Advogados</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-200 text-sm animate-shake">
                        <AlertTriangle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">E-mail Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 rounded-lg text-white outline-none focus:border-[#C9A857] transition-colors placeholder-gray-700"
                            placeholder="seu.nome@advocacia.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Definir Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 rounded-lg text-white outline-none focus:border-[#C9A857] transition-colors placeholder-gray-700"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gold py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(201,168,87,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processando..." : "Criar Conta"}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-[#333]">
                    <a href="/login" className="text-gray-500 text-xs hover:text-[#C9A857] transition-colors">
                        Já possui conta? Fazer Login
                    </a>
                </div>
            </div>
            {/* Legal Footer */}
            <div className="absolute bottom-6 text-center w-full z-10 opacity-30 pointer-events-none">
                <p className="text-[10px] text-white uppercase tracking-[0.2em] font-light">
                    Sistema de Gestão Jurídica &bull; Acesso Restrito &bull; © 2026
                </p>
            </div>
        </div>
    );
}
