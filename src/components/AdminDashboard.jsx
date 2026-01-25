import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import {
    LogOut, Trash2, ExternalLink, Eye, Copy, FileText, Activity, Calendar,
    Users, UserPlus, Shield, Smartphone, Monitor, MapPin, Clock,
    CheckCircle, Lock, Loader2, Info, ChevronRight, Search, Upload, ChevronLeft, Database, HelpCircle
} from 'lucide-react';
import { UploadForm } from './UploadForm';
import { OptimizedBackground } from './OptimizedBackground';

export function AdminDashboard({ supabase, session }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upload'); // 'processos', 'upload', 'equipe'
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);

    // Create User States
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newIsAdmin, setNewIsAdmin] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Current User State
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 9;

    // Derived State
    const isAdmin = currentUserRole === 'admin';

    // History Modal
    const [selectedVideoHistory, setSelectedVideoHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchVideos();
        checkUserRole();
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery]); // Re-fetch when page changes or search query updates

    const showToast = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchVideos = async () => {
        setLoading(true);
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('videos_pecas')
            .select('*', { count: 'exact' });

        if (searchQuery) {
            query = query.or(`processo.ilike.%${searchQuery}%,titulo_peca.ilike.%${searchQuery}%`);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching videos:', error);
            showToast('error', 'Erro ao carregar vídeos.');
        } else {
            setVideos(data || []);
            setTotalItems(count || 0);
        }
        setLoading(false);
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data || []);
        }
    };

    const copyLink = (slug) => {
        const url = `${window.location.origin}/?v=${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(slug);
        setTimeout(() => setCopiedId(null), 2000);
        showToast('success', 'Link copiado!');
    };

    const openHistory = async (slug) => {
        setSelectedVideoHistory({ slug, logs: [] });
        setLoadingHistory(true);

        const { data, error } = await supabase
            .from('view_logs')
            .select('*')
            .eq('video_slug', slug)
            .order('viewed_at', { ascending: false });

        if (error) {
            console.error("Error fetching logs:", error);
            showToast('error', "Erro ao carregar histórico.");
        } else {
            setSelectedVideoHistory({ slug, logs: data || [] });
        }
        setLoadingHistory(false);
    };

    const checkUserRole = async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (data && data.role === 'admin') {
            setCurrentUserRole('admin');
        } else {
            setCurrentUserRole('user');
            if (activeTab === 'equipe') setActiveTab('processos');
        }
    };

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);

    const handleDelete = (id) => {
        setVideoToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!videoToDelete) return;
        setShowDeleteModal(false); // Close immediately for UX

        const { error } = await supabase.from('videos_pecas').delete().eq('id', videoToDelete);

        if (!error) {
            setVideos(videos.filter(v => v.id !== videoToDelete));
            showToast('success', 'Processo removido com sucesso.');
        } else {
            showToast('error', "Erro ao excluir: " + error.message);
        }
        setVideoToDelete(null);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleCreateUserRequest = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmCreateUser = async () => {
        setShowConfirmModal(false);
        setLoadingCreate(true);
        const email = newUserEmail.trim();
        const password = newUserPassword.trim();

        if (!email || !password) {
            showToast('error', 'Preencha email e senha.');
            setLoadingCreate(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            if (data?.user && newIsAdmin) {
                await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
            }
            showToast('success', 'Novo usuário criado com sucesso.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setLoadingCreate(false);
        }
    };

    const handleToggleRole = async (userId, currentRole, email) => {
        if (!userId) return;
        if (session.user.id === userId) {
            showToast('error', 'Você não pode alterar sua própria permissão.');
            return;
        }

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            showToast('success', `Permissão de ${email} atualizada.`);
            fetchUsers();
        } catch (error) {
            console.error("Error toggling role:", error);
            showToast('error', 'Erro ao atualizar. Verifique se você é admin.');
        }
    };

    const handleDeleteUserRequest = (userId) => {
        setUserToDelete(userId);
        setShowDeleteUserModal(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userToDelete);

            if (error) throw error;

            // Immediately update UI
            setUsers(users.filter(u => u.id !== userToDelete));
            showToast('success', 'Membro removido da equipe com sucesso.');
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            showToast('error', 'Erro ao remover. Verifique suas permissões.');
        } finally {
            setShowDeleteUserModal(false);
            setUserToDelete(null);
        }
    };

    // --- RENDER HELPERS ---

    const StatsCard = ({ title, value, icon, color }) => (
        <div className="bg-[#1a1a1a]/50 backdrop-blur border border-[#333] p-5 rounded-xl flex items-center justify-between group hover:border-[#E5B935]/30 transition-all">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white font-serif">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
                {icon}
            </div>
        </div>
    );

    return (
        <OptimizedBackground
            imageSrc="/login-bg.png"
            className="min-h-screen font-sans text-slate-200 overflow-hidden animate-fade-in"
            overlayClass="bg-slate-950/90"
        >
            <div className="relative z-10 h-full overflow-y-auto">
                {/* Notifications */}
                {notification && (
                    <div className={`fixed top-6 right-6 z-[100] animate-slide-in px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-100' : 'bg-red-900/90 border-red-500/30 text-red-100'}`}>
                        {notification.type === 'success' ? <CheckCircle size={18} /> : <LogOut size={18} />}
                        <span className="font-medium text-sm">{notification.message}</span>
                    </div>
                )}


                {/* Navbar */}
                <nav className="h-20 border-b border-[#222] bg-[#111]/90 backdrop-blur sticky top-0 z-40 flex items-center justify-between px-6">
                    {/* Left Side: Logo + Navigation */}
                    <div className="flex items-center gap-12">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-auto overflow-hidden flex items-center">
                                <Logo size="small" />
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'upload' ? 'bg-[#C9A857] text-[#111] shadow-lg shadow-[#C9A857]/20 scale-105' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white hover:-translate-y-0.5 border border-[#333]'}`}
                            >
                                <Upload size={activeTab === 'upload' ? 18 : 16} className={activeTab === 'upload' ? "text-[#111]" : "group-hover:text-[#C9A857]"} />
                                Novo Processo
                            </button>

                            <button
                                onClick={() => setActiveTab('processos')}
                                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'processos' ? 'bg-[#C9A857] text-[#111] shadow-lg shadow-[#C9A857]/20 scale-105' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white hover:-translate-y-0.5 border border-[#333]'}`}
                            >
                                <Activity size={activeTab === 'processos' ? 18 : 16} className={activeTab === 'processos' ? "text-[#111]" : "group-hover:text-[#C9A857]"} />
                                Monitoramento
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('equipe')}
                                    className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'equipe' ? 'bg-[#C9A857] text-[#111] shadow-lg shadow-[#C9A857]/20 scale-105' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white hover:-translate-y-0.5 border border-[#333]'}`}
                                >
                                    <Users size={activeTab === 'equipe' ? 18 : 16} className={activeTab === 'equipe' ? "text-[#111]" : "group-hover:text-[#C9A857]"} />
                                    Equipe
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Logout */}
                    <button onClick={handleSignOut} className="p-2.5 hover:bg-red-900/20 rounded-xl text-slate-400 hover:text-red-400 transition-colors" title="Sair">
                        <LogOut size={20} />
                    </button>
                </nav>

                <main className={`mx-auto ${activeTab === 'upload' ? 'w-full px-6' : 'max-w-7xl p-10 space-y-10'}`}>
                    {
                        activeTab === 'processos' && (
                            <>
                                {/* Search Bar */}
                                <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
                                    <div className="relative w-full max-w-lg">
                                        <input
                                            type="text"
                                            placeholder="Buscar por nome do cliente ou nº do processo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 pl-12 rounded-lg focus:border-[#C9A857] outline-none transition-all placeholder-gray-600"
                                        />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-gray-500">
                                            {videos.length} resultados encontrados
                                        </div>
                                        <div className="group relative cursor-help">
                                            <HelpCircle size={16} className="text-[#C9A857]/50 hover:text-[#C9A857] transition-colors" />
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-[#222] border border-[#C9A857]/30 text-gray-300 text-[10px] p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                                                <p className="font-bold text-[#C9A857] mb-1">Busca Inteligente</p>
                                                Digite o nome do cliente ou parte do número do processo. O sistema filtra automaticamente em tempo real.
                                                <div className="absolute bottom-full right-1 -mb-1 border-4 border-transparent border-b-[#C9A857]/30"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                                            <Loader2 size={40} className="animate-spin text-[#C9A857] mb-4" />
                                            <p>Carregando dados do servidor...</p>
                                        </div>
                                    ) : videos.length === 0 ? (
                                        <div className="col-span-full py-20 bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-center">
                                            <div className="p-4 bg-[#111] rounded-full mb-4 ring-4 ring-[#C9A857]/10">
                                                <Upload size={32} className="text-[#C9A857]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 font-serif">Nenhum processo encontrado</h3>
                                            <p className="text-gray-400 text-sm max-w-md mb-6">Comece fazendo upload do primeiro vídeo e PDF para disponibilizar aos seus clientes.</p>
                                            <button onClick={() => setActiveTab('upload')} className="bg-[#C9A857] hover:bg-[#b08d40] text-[#111] px-6 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-[#C9A857]/20">
                                                Novo Upload
                                            </button>
                                        </div>
                                    ) : (
                                        videos.map(video => (
                                            <div key={video.id} className="group bg-[#111] border border-[#333] rounded-xl overflow-hidden hover:border-[#C9A857]/50 hover:shadow-2xl hover:shadow-[#C9A857]/10 transition-all duration-300 flex flex-col">
                                                {/* Activity Indicator Stripe */}
                                                <div className="h-1 w-full bg-gradient-to-r from-[#C9A857] to-[#e4c986] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                {/* Card Header - Processo Info */}
                                                <div className="p-5 flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="bg-[#1a1a1a] text-[#C9A857] border border-[#C9A857]/20 text-[10px] font-mono px-2 py-1 rounded font-bold uppercase tracking-wider">
                                                            Processo: {video.processo}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {/* Password Indicator */}
                                                            {video.access_password && (
                                                                <div className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-500/20" title="Protegido por senha">
                                                                    <Lock size={10} />
                                                                </div>
                                                            )}
                                                            {/* Views Counter */}
                                                            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium bg-[#1a1a1a] px-2 py-1 rounded-lg border border-[#333]">
                                                                <Eye size={12} className={video.views > 0 ? "text-[#C9A857]" : "text-gray-600"} />
                                                                {video.views || 0}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-lg font-bold text-white leading-tight mb-3 line-clamp-2" title={video.titulo_peca}>
                                                        {video.titulo_peca}
                                                    </h3>

                                                    {/* Info Grid */}
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        <div className="bg-[#1a1a1a]/50 p-2 rounded-lg border border-[#222]">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Criado em</p>
                                                            <p className="text-xs text-gray-300 flex items-center gap-1">
                                                                <Calendar size={10} className="text-[#C9A857]" />
                                                                {new Date(video.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="bg-[#1a1a1a]/50 p-2 rounded-lg border border-[#222]">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                                                            <p className="text-xs flex items-center gap-1">
                                                                {video.views > 0 ? (
                                                                    <>
                                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                                        <span className="text-emerald-400">Visualizado</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                                                        <span className="text-amber-400">Aguardando</span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Slug Preview */}
                                                    <div className="bg-[#0a0a0a] text-gray-500 text-[10px] font-mono px-2 py-1.5 rounded border border-[#222] truncate" title={`${window.location.origin}/?v=${video.slug}`}>
                                                        {window.location.origin}/?v={video.slug}
                                                    </div>
                                                </div>

                                                {/* Actions Footer */}
                                                <div className="bg-[#1a1a1a]/50 border-t border-[#333] p-3 grid grid-cols-2 gap-2">
                                                    <button onClick={() => openHistory(video.slug)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-gray-300 text-xs font-medium transition-colors border border-[#333]">
                                                        <Activity size={14} /> Histórico
                                                    </button>
                                                    <button onClick={() => copyLink(video.slug)} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${copiedId === video.slug ? 'bg-[#C9A857]/10 border-[#C9A857]/30 text-[#C9A857]' : 'bg-transparent border-[#333] text-gray-400 hover:text-white hover:border-gray-600'}`}>
                                                        {copiedId === video.slug ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                        {copiedId === video.slug ? 'Copiado' : 'Copiar Link'}
                                                    </button>
                                                    <a href={`/?v=${video.slug}`} target="_blank" className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#C9A857] hover:bg-[#b08d40] text-[#111] text-xs font-bold transition-all hover:scale-[1.02] shadow-lg shadow-[#C9A857]/20">
                                                        <ExternalLink size={14} /> Abrir Página
                                                    </a>
                                                    <button onClick={() => handleDelete(video.id)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/10 hover:bg-red-900/20 text-red-400 text-xs font-medium transition-colors border border-red-900/20">
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )
                    }

                    {/* Pagination Controls */}
                    {activeTab === 'processos' && videos.length > 0 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-[#222]">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed border border-[#333] transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-bold text-gray-500">
                                Página <span className="text-[#C9A857]">{currentPage}</span> de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed border border-[#333] transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {
                        activeTab === 'upload' && (
                            <div className="animate-fade-in-up w-full">
                                <UploadForm supabase={supabase} onSuccess={() => {
                                    setActiveTab('processos');
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                    fetchVideos();
                                    showToast('success', 'Upload concluído!');
                                }} />
                            </div>
                        )
                    }

                    {
                        activeTab === 'equipe' && (
                            <div className="animate-fade-in-up space-y-8">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#333] pb-8">
                                    <div>
                                        <h1 className="text-3xl font-serif font-bold text-[#C9A857] mb-2">Gestão de Equipe</h1>
                                        <p className="text-gray-400 text-sm max-w-xl flex items-center gap-2">
                                            <Info size={14} className="text-[#C9A857]" />
                                            Controle quem tem acesso ao painel. Apenas Admins podem criar ou remover usuários.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(window.location.origin + '/cadastro'); showToast('success', 'Link copiado!'); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-[#C9A857] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-[#C9A857]/20 hover:border-[#C9A857]/50"
                                        >
                                            <Copy size={14} /> Copiar Link de Cadastro
                                        </button>
                                        <div className="group relative cursor-help">
                                            <HelpCircle size={16} className="text-gray-500 hover:text-[#C9A857] transition-colors" />
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#222] border border-[#C9A857]/30 text-gray-300 text-[10px] normal-case p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                <p className="font-bold text-[#C9A857] mb-1">🔗 Link de Cadastro</p>
                                                <p className="mb-2">Envie este link para novos membros da equipe criarem suas próprias contas.</p>
                                                <p className="text-gray-400">⚠️ As contas criadas começam como "Operador". Promova a Admin manualmente se necessário.</p>
                                                <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-[#C9A857]/30"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Create User Card - Didactic Form */}
                                    <div className="bg-[#1a1a1a] border border-[#C9A857]/20 rounded-xl p-6 h-fit sticky top-28 shadow-[0_0_30px_rgba(201,168,87,0.05)]">
                                        <h3 className="text-lg font-bold text-[#C9A857] mb-4 flex items-center gap-2 font-serif">
                                            <div className="p-1.5 bg-[#C9A857] rounded text-black"><UserPlus size={16} /></div>
                                            Adicionar Membro
                                        </h3>

                                        <form onSubmit={handleCreateUserRequest} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail Corporativo</label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="ex: dr.silva@almeidaadv.com.br"
                                                    value={newUserEmail}
                                                    onChange={e => setNewUserEmail(e.target.value)}
                                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-[#C9A857] outline-none transition-colors placeholder-gray-600"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha Temporária</label>
                                                <input
                                                    type="text"
                                                    required
                                                    minLength={6}
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={newUserPassword}
                                                    onChange={e => setNewUserPassword(e.target.value)}
                                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-[#C9A857] outline-none transition-colors placeholder-gray-600"
                                                />
                                            </div>

                                            <div className="flex items-start gap-3 p-3 bg-[#111] rounded-lg border border-[#333]">
                                                <input
                                                    type="checkbox"
                                                    id="adminRole"
                                                    checked={newIsAdmin}
                                                    onChange={e => setNewIsAdmin(e.target.checked)}
                                                    className="mt-1 w-4 h-4 accent-[#C9A857] cursor-pointer"
                                                />
                                                <label htmlFor="adminRole" className="text-sm text-gray-300 cursor-pointer select-none">
                                                    <span className="block font-bold text-[#C9A857]">Nível de Administrador</span>
                                                    <span className="block text-xs text-gray-500">Pode excluir processos e gerenciar outros usuários.</span>
                                                </label>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loadingCreate}
                                                className="w-full bg-[#C9A857] hover:bg-[#b08d40] text-[#111] font-bold py-3 rounded-lg text-sm transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#C9A857]/20 hover:scale-[1.02]"
                                            >
                                                {loadingCreate ? <Loader2 size={16} className="animate-spin" /> : 'Criar Conta de Acesso'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Users List - Clean Rows */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Membros Ativos ({users.length})</h3>
                                        {users.map(user => {
                                            const isAdmin = user.role === 'admin';
                                            const isMe = session.user.id === user.id;

                                            return (
                                                <div key={user.id} className="bg-[#1a1a1a] border border-[#333] p-4 rounded-xl flex items-center justify-between group hover:border-[#C9A857]/30 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isAdmin ? 'bg-[#C9A857]/20 text-[#C9A857] border border-[#C9A857]/30' : 'bg-[#111] text-gray-500 border border-[#333]'}`}>
                                                            {user.email.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-white font-medium text-sm">{user.email}</h4>
                                                                {isMe && <span className="bg-[#111] text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#333]">VOCÊ</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                {isAdmin ? <Shield size={10} className="text-[#C9A857]" /> : <Users size={10} />}
                                                                {isAdmin ? 'Administrador Total' : 'Visualizador / Operador'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Tech Toggle Button */}
                                                    {!isMe && (
                                                        <div className="hidden group-hover:flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDeleteUserRequest(user.id)}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-red-500/20 text-red-500 hover:bg-red-900/20"
                                                                title="Deletar este usuário"
                                                            >
                                                                <Trash2 size={12} /> Deletar
                                                            </button>

                                                            <button
                                                                onClick={() => handleToggleRole(user.id, user.role, user.email)}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isAdmin
                                                                    ? 'border-orange-500/20 text-orange-400 hover:bg-orange-900/10'
                                                                    : 'border-[#C9A857]/20 text-[#C9A857] hover:bg-[#C9A857]/10'
                                                                    }`}
                                                            >
                                                                {isAdmin ? 'Remover Admin' : 'Promover a Admin'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </main >

                {/* Confirmation Modal */}
                {
                    showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-[#1a1a1a] border border-[#C9A857]/30 p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(201,168,87,0.1)]">
                                <h3 className="text-lg font-bold text-[#C9A857] mb-2 text-center font-serif">Confirmar Criação?</h3>
                                <p className="text-gray-400 text-sm text-center mb-6">
                                    Para segurança, sua sessão será reiniciada para logar no novo usuário criado.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm font-medium transition-colors border border-[#333]">Cancelar</button>
                                    <button onClick={confirmCreateUser} className="flex-1 py-2.5 bg-[#C9A857] hover:bg-[#b08d40] text-[#111] rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#C9A857]/20">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Delete Confirmation Modal */}
                {
                    showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-[#1a1a1a] border border-red-900/40 p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-red-900/20 rounded-full text-red-500 ring-1 ring-red-500/30">
                                        <Trash2 size={24} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 text-center font-serif">Excluir Processo?</h3>
                                <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
                                    Atenção: Esta ação é irreversível. O processo e todos os arquivos serão apagados.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm font-medium transition-colors border border-[#333]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-2.5 bg-red-900/80 hover:bg-red-800 text-white rounded-lg text-sm font-bold transition-colors border border-red-500/30 shadow-lg shadow-red-900/20"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Delete User Confirmation Modal */}
                {
                    showDeleteUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-[#1a1a1a] border border-red-900/40 p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-red-900/20 rounded-full text-red-500 ring-1 ring-red-500/30">
                                        <Trash2 size={24} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 text-center font-serif">Remover da Equipe?</h3>
                                <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
                                    Ao confirmar, este usuário perderá o acesso imediato ao painel.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteUserModal(false)}
                                        className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-sm font-medium transition-colors border border-[#333]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDeleteUser}
                                        className="flex-1 py-2.5 bg-red-900/80 hover:bg-red-900 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* View History Modal */}
                {
                    selectedVideoHistory && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
                            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Histórico de Acessos</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{selectedVideoHistory.slug}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedVideoHistory(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <LogOut size={18} className="rotate-180" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {loadingHistory ? (
                                        <div className="text-center py-10 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" />Carregando...</div>
                                    ) : selectedVideoHistory.logs.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500">Nenhum acesso registrado.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedVideoHistory.logs.map((log, i) => (
                                                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-slate-900 rounded-lg text-indigo-400">
                                                            {log.device?.toLowerCase().includes('mobile') ? <Smartphone size={16} /> : <Monitor size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white flex gap-2 items-center">
                                                                <MapPin size={12} className="text-slate-500" />
                                                                {log.location || 'Local Desconhecido'}
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{log.ip}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-emerald-400 font-mono">{new Date(log.viewed_at).toLocaleTimeString()}</div>
                                                        <div className="text-[10px] text-slate-600 uppercase font-bold">{new Date(log.viewed_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </OptimizedBackground>
    );
}
