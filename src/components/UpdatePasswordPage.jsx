
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export function UpdatePasswordPage({ supabase }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Verifica se temos o hash com o token (Supabase envia no hash da URL)
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) {
            // Se não tiver hash, talvez o supabase já tenha lidado com a sessão via cookies/localstorage
            // Mas idealmente o usuario chega aqui vindo do email
        }
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="text-center space-y-4 animate-fade-in-up">
                    <div className="flex justify-center text-green-500">
                        <CheckCircle size={64} />
                    </div>
                    <h2 className="text-2xl text-white font-bold">Senha Atualizada!</h2>
                    <p className="text-gray-400">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

            <div className="w-full max-w-md bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-2xl relative z-10">
                <div className="flex justify-center mb-8">
                    <Logo size="medium" />
                </div>

                <h2 className="text-xl text-white font-serif text-center mb-6 flex items-center justify-center gap-2">
                    <Lock size={20} className="text-[#E5B935]" /> Definir Nova Senha
                </h2>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-gray-400 text-xs uppercase tracking-wide mb-1">Nova Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded-xl focus:border-[#C9A857] outline-none transition-colors"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-gold py-3 rounded-xl font-bold uppercase tracking-wider mt-4 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Salvar Nova Senha"}
                    </button>
                </form>
            </div>
        </div>
    );
}
