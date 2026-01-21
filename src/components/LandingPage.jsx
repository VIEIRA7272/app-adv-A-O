import React from 'react';
import { Scale, Lock, Download, PlayCircle, FileText } from 'lucide-react';
import { Logo } from './Logo';
import { AppConfig } from '../lib/app_config';
import noiseBg from '../assets/noise.svg';

export function LandingPage({ data, supabase }) {
    // Inicializa com o valor que veio do banco (ou 0 se for nulo)
    const [viewCount, setViewCount] = React.useState(data.views || 0);

    // Password Protection State
    const [isLocked, setIsLocked] = React.useState(!!data.access_password);
    const [passwordInput, setPasswordInput] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    // Video State
    const [isPlaying, setIsPlaying] = React.useState(false);

    React.useEffect(() => {
        // Se estiver bloqueado, não incrementa visualização ainda
        if (isLocked) return;

        const recordView = async () => {
            if (!supabase) return;

            // Evitar contagem duplicada na mesma sessão
            const sessionKey = `viewed_${data.slug}`;
            if (sessionStorage.getItem(sessionKey)) return;

            try {
                // 1. Obter dados do usuário (IP e Localização)
                let ipData = { ip: null, city: null, region: null };
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (res.ok) {
                        const json = await res.json();
                        ipData = {
                            ip: json.ip,
                            city: json.city,
                            region: json.region
                        };
                    }
                } catch (e) {
                    console.warn("Não foi possível obter IP/Localização", e);
                }

                const locationString = ipData.city && ipData.region ? `${ipData.city}, ${ipData.region}` : (ipData.city || "Desconhecido");

                // 2. Registrar Log detalhado
                await supabase.from('view_logs').insert({
                    video_slug: data.slug,
                    ip: ipData.ip,
                    location: locationString,
                    device: navigator.userAgent
                });

                // 3. Incrementar contador total (para exibir na tela)
                const { error } = await supabase.rpc('increment_views', { row_id: data.id });

                if (error) {
                    // Fallback se RPC falhar
                    await supabase
                        .from('videos_pecas')
                        .update({ views: (data.views || 0) + 1 })
                        .eq('id', data.id);
                }

                setViewCount(prev => prev + 1);
                sessionStorage.setItem(sessionKey, 'true');

            } catch (err) {
                console.error("Erro ao registrar visualização:", err);
            }
        };

        recordView();
    }, [data.id, data.slug, supabase, data.views, isLocked]);

    const handleUnlock = (e) => {
        e.preventDefault();
        // Simple comparison (client-side for MVP)
        if (passwordInput === data.access_password) {
            setIsLocked(false);
            setPasswordError("");
        } else {
            setPasswordError("Senha incorreta.");
        }
    };

    if (isLocked) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#050505] to-[#000000]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5B935]/5 rounded-full blur-[100px] animate-pulse"></div>

                <div className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-[#C9A857]/30 p-6 md:p-10 rounded-2xl shadow-2xl text-center relative z-10 animate-scale-in">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#C9A857]/20 to-transparent flex items-center justify-center text-[#C9A857] border border-[#C9A857]/20 shadow-[0_0_20px_rgba(201,168,87,0.1)]">
                            <Lock size={32} className="md:w-9 md:h-9" />
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl text-white font-serif font-bold mb-2">Acesso Restrito</h2>
                    <p className="text-gray-400 text-sm mb-6 md:mb-8 leading-relaxed">Este conteúdo é confidencial e protegido. Por favor, insira suas credenciais para continuar.</p>

                    <form onSubmit={handleUnlock} className="space-y-4 md:space-y-5">
                        <div className="relative">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 md:py-4 rounded-lg focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] outline-none text-center tracking-[0.5em] text-base md:text-lg placeholder-gray-700 transition-all font-mono shadow-inner"
                                placeholder="******"
                                autoFocus
                            />
                        </div>
                        {passwordError && (
                            <p className="text-red-400 text-xs animate-shake font-medium">{passwordError}</p>
                        )}
                        <button type="submit" className="w-full btn-gold py-3 md:py-4 rounded-lg font-bold uppercase tracking-widest text-xs md:text-sm hover:shadow-[0_0_20px_rgba(201,168,87,0.3)] transition-all transform hover:-translate-y-0.5">
                            Desbloquear Acesso
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] font-sans flex flex-col relative overflow-x-hidden">
            {/* Premium Background Mesh */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="hidden md:block absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#C9A857]/5 rounded-full blur-[120px] opacity-40"></div>
                <div className="hidden md:block absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] opacity-30"></div>
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `url(${noiseBg})` }}
                ></div>
            </div>

            {/* Top Navigation */}
            <div className="relative z-20 w-full px-6 py-6 flex justify-center md:justify-between items-center max-w-7xl mx-auto">
                <Logo size="medium" />
                <div className="hidden md:flex items-center gap-2 text-[#C9A857]/50 text-xs font-medium tracking-widest uppercase border border-[#C9A857]/10 px-3 py-1 rounded-full">
                    <Lock size={12} />
                    Ambiente Seguro e Criptografado
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4 relative z-10 w-full">
                <div className="w-full max-w-5xl animate-fade-in-up">

                    {/* Header Section */}
                    <div className="text-center mb-8 md:mb-10 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-[#C9A857]/10 text-[#C9A857] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#C9A857]/20 shadow-[0_0_15px_rgba(201,168,87,0.1)] backdrop-blur-sm">
                            <Scale size={14} /> Processo nº {data.processo}
                        </div>
                        <h1 className="text-2xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f0f0f0] to-[#999] tracking-tight leading-tight drop-shadow-sm px-2">
                            {data.titulo_peca || "Peça Processual Digital"}
                        </h1>
                        <p className="text-gray-400 text-xs md:text-base max-w-2xl mx-auto leading-relaxed px-4">
                            Acompanhe abaixo a explicação detalhada em vídeo referente à peça protocolada.
                            Este formato visa trazer mais clareza e celeridade ao entendimento dos fatos.
                        </p>
                    </div>

                    {/* Video Player Card */}
                    <div className="relative group w-full">
                        {/* Glow Effect behind video - Hidden on mobile for performance */}
                        <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-[#C9A857] to-[#8a7238] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative aspect-video bg-black rounded-xl border border-[#333] shadow-2xl overflow-hidden ring-1 ring-white/10">

                            {!isPlaying ? (
                                /* Facade / Placeholder */
                                <div
                                    className="absolute inset-0 cursor-pointer group/play"
                                    onClick={() => setIsPlaying(true)}
                                >
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none z-10"></div>

                                    {/* Thumbnail Placeholder - Could use data.thumbnail_url if available, falling back to black/gradient */}
                                    <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                                        {/* Optional: Add a subtle loading or placeholder pattern here */}
                                    </div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-300 group-hover/play:scale-110">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#C9A857]/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(201,168,87,0.3)] group-hover/play:bg-[#C9A857] cursor-pointer">
                                            <PlayCircle size={32} className="text-white fill-white ml-1" />
                                        </div>
                                    </div>

                                    <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        <span className="text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-sm">
                                            Toque para assistir
                                        </span>
                                    </div>

                                    <div className="absolute bottom-6 w-full text-center z-20">
                                        <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Carregar Vídeo Explicativo</p>
                                    </div>
                                </div>
                            ) : (
                                /* Actual Video Player */
                                <video
                                    autoPlay
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-full object-cover relative z-0 animate-fade-in"
                                    poster={null}
                                >
                                    <source src={data.video_url} type="video/mp4" />
                                    Seu navegador não suporta a visualização deste vídeo.
                                </video>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-4xl mx-auto">
                        {/* Stats */}
                        {/* Stats - Visualizações (Visível apenas para Admin agora) */}
                        <div className="flex justify-center md:justify-start items-center gap-4 text-gray-500">
                            <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70">
                                {new Date(data.created_at || Date.now()).toLocaleDateString()}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="flex justify-center md:justify-end">
                            <a
                                href={data.pdf_final_url}
                                target="_blank"
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-[#C9A857] to-[#AA8A39] text-black font-bold text-sm uppercase tracking-widest rounded-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(201,168,87,0.5)]"
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors"></div>
                                <FileText size={18} className="relative z-10" />
                                <span className="relative z-10">Visualizar Documento (PDF)</span>
                                <div className="absolute right-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                                    <Download size={16} />
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Legal */}
            <footer className="py-12 text-center relative z-10 opacity-60">
                <div className="flex justify-center mb-6 opacity-80">
                    <Logo size="small" />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest md:tracking-[0.3em] font-light">
                    {AppConfig.officeName} &bull; Acesso Seguro &bull; © 2026
                </p>
            </footer>
        </div>
    );
}
