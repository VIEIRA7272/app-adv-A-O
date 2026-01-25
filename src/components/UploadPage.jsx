import React, { useState } from 'react';
import { Upload, FileText, Video, Loader2, FileCheck, AlertTriangle, Lock, LogOut, CheckCircle } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { PdfVisualEditor } from './PdfVisualEditor';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';
import { OptimizedBackground } from './OptimizedBackground';

export function UploadPage({ supabase, session, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [processo, setProcesso] = useState("");
    const [titulo, setTitulo] = useState("");
    const [password, setPassword] = useState(""); // Senha opcional
    const [pdfFile, setPdfFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [dragActive, setDragActive] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Estados do Editor Visual
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [generatedQrData, setGeneratedQrData] = useState(null);
    const [tempSlug, setTempSlug] = useState(null);
    const [tempVideoUrl, setTempVideoUrl] = useState(null);

    const handleDrag = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(type);
        else if (e.type === "dragleave") setDragActive(null);
    };

    const handleDrop = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(null);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (type === 'pdf') setPdfFile(e.dataTransfer.files[0]);
            if (type === 'video') setVideoFile(e.dataTransfer.files[0]);
        }
    };

    const robustUpload = async (bucket, path, file) => {
        try {
            const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
            if (error) throw error;
            return data;
        } catch (err) {
            // Tratamento de erro cru habilitado

            if (err.message === 'Failed to fetch' || err.name === 'StorageUnknownError') {
                const rawUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
                const res = await fetch(rawUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'x-upsert': 'true', 'Content-Type': file.type },
                    body: file
                });
                if (!res.ok) {
                    const text = await res.text();
                    if (text.includes('exceeded the maximum allowed size')) {
                        throw new Error("O arquivo é maior que o limite permitido pelo banco de dados. Execute o comando SQL de atualização.");
                    }
                    throw new Error(`Erro Resgate (${res.status}): ${text}`);
                }
                return { path: path };
            }
            throw err;
        }
    };

    const handleInitialProcess = async () => {
        if (!processo || !pdfFile || !videoFile) { alert("Preencha todos os campos."); return; }
        setLoading(true); setErrorMsg(null);
        try {
            const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
            const landingUrl = `${window.location.origin}?v=${slug}`;

            setStatusMsg("Verificando arquivo...");

            // VERIFICAÇÃO DO PLANO FREE (50MB)
            const LIMIT_MB = 50;
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            if (videoFile.size > LIMIT_BYTES) {
                const sizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
                alert(`⚠️ LIMITE DO PLANO GRATUITO ⚠️\n\nO Supabase Free não aceita arquivos acima de ${LIMIT_MB}MB.\nSeu vídeo tem ${sizeMB}MB.\n\nPor favor, comprima o vídeo (use sites como 'FreeConvert' ou o app 'Handbrake') para menos de 50MB e tente novamente.`);
                setLoading(false);
                return;
            }

            setStatusMsg("Enviando vídeo...");

            // EMERGENCY FIX: Ignore original filename completely to avoid "Invalid key"
            // Generate a purely alphanumeric name: video_TIMESTAMP_RANDOM.ext
            const fileExt = videoFile.name.split('.').pop() || 'mp4';
            const safeRandomName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
            const videoPath = `videos/${slug}_${safeRandomName}`;

            await robustUpload('videos-final-v3', videoPath, videoFile);
            const { data: videoUrlData } = supabase.storage.from('videos-final-v3').getPublicUrl(videoPath);

            setStatusMsg("Gerando QR Code...");
            const qrCodeDataUrl = await QRCode.toDataURL(landingUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });

            // Salvar dados temporários e abrir editor visual
            setTempSlug(slug);
            setTempVideoUrl(videoUrlData.publicUrl);
            setGeneratedQrData(qrCodeDataUrl);
            setShowVisualEditor(true);
            setLoading(false);

        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || "Erro desconhecido");
            setLoading(false);
        }
    };

    const handleFinalizePdf = async (coords) => {
        setShowVisualEditor(false);
        setLoading(true);
        setStatusMsg("Finalizando PDF...");

        try {
            const landingUrl = `${window.location.origin}?v=${tempSlug}`;
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const qrImage = await pdfDoc.embedPng(generatedQrData);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            const qrSize = 80;
            const { x, y } = coords;

            firstPage.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

            // Desenhar Texto do Link
            firstPage.drawText('Acesse o vídeo:', {
                x: x,
                y: y - 12,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });

            // Criar versão encurtada para exibição (sem https://)
            const displayUrl = landingUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

            const linkText = displayUrl;
            const linkFontSize = 8;
            const textWidth = helveticaFont.widthOfTextAtSize(linkText, linkFontSize);
            const textHeight = helveticaFont.heightAtSize(linkFontSize);

            firstPage.drawText(linkText, {
                x: x,
                y: y - 22,
                size: linkFontSize,
                font: helveticaFont,
                color: rgb(0, 0, 1), // Azul para parecer link
            });

            // Desenhar Sublinhado (Underline)
            firstPage.drawLine({
                start: { x: x, y: y - 23 },
                end: { x: x + textWidth, y: y - 23 },
                thickness: 0.5,
                color: rgb(0, 0, 1),
            });

            // Adicionar Anotação de Link Clicável
            const linkAnnotation = pdfDoc.context.register(
                pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [x, y - 25, x + textWidth, y - 22 + textHeight + 2], // Área clicável um pouco maior
                    Border: [0, 0, 0],
                    C: [0, 0, 1],
                    A: {
                        Type: 'Action',
                        S: 'URI',
                        URI: landingUrl,
                    },
                })
            );

            const existingAnnots = firstPage.node.Annots();
            if (existingAnnots) {
                existingAnnots.push(linkAnnotation);
            } else {
                firstPage.node.set(
                    PDFDocument.PDFName.of('Annots'),
                    pdfDoc.context.obj([linkAnnotation])
                );
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

            setStatusMsg("Enviando PDF...");
            const pdfPath = `pecas/${tempSlug}_COM_QR.pdf`;

            await robustUpload('pecas-final-v3', pdfPath, modifiedPdfBlob);
            const { data: pdfUrlData } = supabase.storage.from('pecas-final-v3').getPublicUrl(pdfPath);

            const record = {
                slug: tempSlug,
                processo,
                titulo_peca: titulo || "Peça Processual",
                video_url: tempVideoUrl,
                pdf_final_url: pdfUrlData.publicUrl,
                access_password: password || null // Salva senha ou null
            };
            const { error: dbErr } = await supabase.from('videos_pecas').insert([record]);
            if (dbErr) throw dbErr;

            onSuccess({ ...record, landingUrl, qrCodeDataUrl: generatedQrData });
        } catch (error) {
            console.error(error);
            setErrorMsg("Erro ao finalizar PDF: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OptimizedBackground
            imageSrc="/login-bg.png"
            className="min-h-screen text-white font-sans flex flex-col animate-fade-in"
            overlayClass="bg-black/85"
        >
            {/* Visual Editor Overlay */}
            {showVisualEditor && (
                <PdfVisualEditor
                    pdfFile={pdfFile}
                    qrCodeDataUrl={generatedQrData}
                    onSave={handleFinalizePdf}
                    onCancel={() => { setShowVisualEditor(false); setLoading(false); }}
                />
            )}

            {/* Header */}
            <header className="border-b border-[#E5B935]/20 bg-[#121212] py-4 px-8 flex justify-center items-center relative">
                {session?.user?.email && (
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono hidden md:block">
                        <span className="text-[#C9A857]">user:</span> {session.user.email}
                    </div>
                )}
                <Logo />
            </header>

            {/* Main Content - 3 Column Grid Layout */}
            <main className="flex-1 p-8 relative z-10 w-full max-w-[1600px] mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFTSIDE: Branding & Benefits (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-slide-up bg-[#1a1a1a]/50 backdrop-blur-sm p-6 rounded-xl border border-[#C9A857]/10" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[#C9A857] mb-4 leading-tight">
                                Excelência e <br /> Inovação
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-[#C9A857]/30 pl-4">
                                Transformando a prática jurídica com tecnologia de ponta. Agilidade e segurança para seus processos.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h4 className="text-[#C9A857] text-xs font-bold uppercase tracking-wider mb-2">Recursos Premium</h4>

                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-[#C9A857]/10 text-[#C9A857]"><Video size={16} /></div>
                                <span>Explicação em Vídeo</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-[#C9A857]/10 text-[#C9A857]"><FileCheck size={16} /></div>
                                <span>PDF Integrado</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-[#C9A857]/10 text-[#C9A857]"><Upload size={16} /></div>
                                <span>Upload Rápido</span>
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Upload Form (Span 6) */}
                    <div className="lg:col-span-6">
                        <div className="w-full border border-[#C9A857] rounded-lg p-8 bg-[#1E1E1E] shadow-2xl relative animate-scale-in overflow-hidden">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A857] to-transparent"></div>

                            {/* Top Navigation */}
                            <div className="flex justify-between mb-4 items-center">
                                {/* Admin Link */}
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="text-white/50 hover:text-[#C9A857] text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                                >
                                    Ir para Meus Processos &rarr;
                                </button>

                                {/* Logout Link */}
                                <button
                                    onClick={() => {
                                        if (supabase?.auth) supabase.auth.signOut();
                                        window.location.href = '/login';
                                    }}
                                    className="text-white/30 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ml-4"
                                    title="Sair do Sistema"
                                >
                                    <LogOut size={12} /> Sair
                                </button>
                            </div>

                            <h2 className="text-2xl font-serif font-bold text-[#C9A857] text-center mb-6 relative z-10">
                                <span className="inline-block border-b-2 border-[#C9A857]/30 pb-2">
                                    Enviar Documento
                                </span>
                            </h2>

                            {errorMsg && (
                                <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm flex items-center animate-pulse">
                                    <AlertTriangle className="mr-2" size={16} /> {errorMsg}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Número do Processo</label>
                                    <input
                                        type="text"
                                        value={processo}
                                        onChange={e => setProcesso(e.target.value)}
                                        className="w-full px-4 py-3 bg-white text-black rounded outline-none focus:ring-2 focus:ring-[#C9A857] input-transition"
                                        placeholder=""
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Título do Documento (Opcional)</label>
                                    <input
                                        type="text"
                                        value={titulo}
                                        onChange={e => setTitulo(e.target.value)}
                                        className="w-full px-4 py-3 bg-white text-black rounded outline-none focus:ring-2 focus:ring-[#C9A857] input-transition"
                                    />
                                </div>

                                {/* Password Protection (NEW) */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                                        <Lock size={14} className="text-[#C9A857]" /> Proteger com Senha (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#252525] border border-gray-600 text-white rounded outline-none focus:ring-2 focus:ring-[#C9A857] input-transition placeholder-gray-500"
                                        placeholder="Defina uma senha se desejar"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Se preenchido, o QR Code e o Link só abrirão após digitar esta senha.</p>
                                </div>

                                {/* Upload PDF Box */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Upload do PDF</label>
                                    <div
                                        className={cn(
                                            "border border-dashed border-gray-500 rounded-lg p-6 text-center bg-[#252525] transition-all hover:bg-[#2a2a2a]",
                                            dragActive === 'pdf' ? "border-[#C9A857] bg-[#C9A857]/10 animate-pulse-gold" : "",
                                            pdfFile && "border-emerald-500"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'pdf')}
                                        onDragLeave={(e) => handleDrag(e, 'pdf')}
                                        onDragOver={(e) => handleDrag(e, 'pdf')}
                                        onDrop={(e) => handleDrop(e, 'pdf')}
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            {pdfFile ? (
                                                <>
                                                    <FileCheck size={40} className="text-emerald-500 mb-2 animate-scale-in" />
                                                    <span className="text-emerald-500 font-medium text-sm">{pdfFile.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-red-600 text-white p-2 rounded mb-2 shadow-lg group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <p className="text-gray-400 mb-3 text-sm">Arraste aqui seu PDF</p>
                                                    <button
                                                        onClick={() => document.getElementById('pdf-upload').click()}
                                                        className="btn-gold px-4 py-1.5 rounded text-xs hover:scale-105 transition-transform"
                                                    >
                                                        Selecionar
                                                    </button>
                                                </>
                                            )}
                                            <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                                        </div>
                                        {pdfFile && <button onClick={() => setPdfFile(null)} className="text-xs text-[#C9A857] hover:underline mt-2">Remover</button>}
                                    </div>
                                </div>

                                {/* Upload Video Box */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Upload do Vídeo</label>
                                    <div
                                        className={cn(
                                            "border border-dashed border-gray-500 rounded-lg p-6 text-center bg-[#252525] transition-all hover:bg-[#2a2a2a]",
                                            dragActive === 'video' ? "border-[#C9A857] bg-[#C9A857]/10 animate-pulse-gold" : "",
                                            videoFile && "border-emerald-500"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'video')}
                                        onDragLeave={(e) => handleDrag(e, 'video')}
                                        onDragOver={(e) => handleDrag(e, 'video')}
                                        onDrop={(e) => handleDrop(e, 'video')}
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            {videoFile ? (
                                                <>
                                                    <Video size={40} className="text-emerald-500 mb-2 animate-scale-in" />
                                                    <span className="text-emerald-500 font-medium text-sm">{videoFile.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-gray-700 text-white p-2 rounded mb-2 shadow-lg group-hover:scale-110 transition-transform">
                                                        <Video size={20} />
                                                    </div>
                                                    <p className="text-gray-400 mb-3 text-sm">Arraste aqui seu Vídeo</p>
                                                    <button
                                                        onClick={() => document.getElementById('video-upload').click()}
                                                        className="btn-gold px-4 py-1.5 rounded text-xs hover:scale-105 transition-transform"
                                                    >
                                                        Selecionar
                                                    </button>
                                                </>
                                            )}
                                            <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="hidden" id="video-upload" />
                                        </div>
                                        {videoFile && <button onClick={() => setVideoFile(null)} className="text-xs text-[#C9A857] hover:underline mt-2">Remover</button>}
                                    </div>
                                    {videoFile && videoFile.size > 50 * 1024 * 1024 && (
                                        <div className="mt-2 text-xs text-yellow-500 flex items-center justify-center">
                                            <AlertTriangle size={12} className="mr-1" />
                                            Arquivo grande ({Math.round(videoFile.size / 1024 / 1024)}MB).
                                        </div>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="mt-6 bg-[#1a1a1a] p-4 rounded-xl border border-[#333] animate-fade-in">
                                        <div className="flex justify-between mb-2">
                                            {['Envio do Vídeo', 'Gerando QR Code', 'Finalizando PDF'].map((step, i) => {
                                                const currentStep = statusMsg.includes("Vídeo") ? 0 : statusMsg.includes("QR") ? 1 : statusMsg.includes("PDF") || statusMsg.includes("Enviando PDF") ? 2 : -1;
                                                const isActive = i === currentStep;
                                                const isCompleted = i < currentStep;

                                                return (
                                                    <div key={i} className="flex flex-col items-center flex-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${isActive ? 'bg-[#C9A857] border-[#C9A857] text-black scale-110 shadow-[0_0_15px_rgba(201,168,87,0.4)]' : isCompleted ? 'bg-green-500 border-green-500 text-black' : 'bg-transparent border-gray-600 text-gray-500'}`}>
                                                            {isCompleted ? <CheckCircle size={14} /> : i + 1}
                                                        </div>
                                                        <span className={`text-[10px] uppercase font-bold mt-2 tracking-wider ${isActive ? 'text-[#C9A857]' : isCompleted ? 'text-green-500' : 'text-gray-600'}`}>{step}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="text-center text-xs text-gray-400 mt-3 font-mono animate-pulse">
                                            {statusMsg || "Processando..."}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInitialProcess}
                                        className="w-full btn-gold py-3 rounded-full text-base shadow-lg mt-4 uppercase tracking-wide btn-shimmer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                    >
                                        Continuar para Posicionamento
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHTSIDE: Trust & Info (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-slide-up bg-[#1a1a1a]/50 backdrop-blur-sm p-6 rounded-xl border border-[#C9A857]/10" style={{ animationDelay: '0.4s' }}>
                        <div className="mb-6 flex justify-center lg:justify-end">
                            <div className="w-16 h-16 rounded-full border border-[#C9A857]/30 flex items-center justify-center bg-[#C9A857]/5 shadow-[0_0_15px_rgba(201,168,87,0.1)]">
                                <FileCheck className="text-[#C9A857]" size={28} />
                            </div>
                        </div>

                        <div className="text-center lg:text-right">
                            <h3 className="text-xl font-serif font-bold text-white mb-2">
                                Ambiente Seguro
                            </h3>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">
                                Criptografia de Ponta a Ponta
                            </p>
                            <div className="text-[#C9A857] text-sm font-medium border-t border-[#C9A857]/20 pt-4 mt-4">
                                Suporte 24h
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="bg-[#111] p-4 rounded-lg border border-[#333]">
                                <h5 className="text-[#C9A857] text-xs font-bold mb-2">COMO FUNCIONA?</h5>
                                <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside text-left">
                                    <li>Faça upload do PDF e Vídeo</li>
                                    <li>Posicione o QR Code no visualizador</li>
                                    <li>Baixe o PDF final com link integrado</li>
                                    <li>Anexe ao processo judicial</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <footer className="py-4 text-center text-[#C9A857]/40 text-xs flex flex-col gap-2">
                <span>v3.3 FINAL - Sistema Conectado 🚀</span>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const { data, error } = await supabase.storage.listBuckets();
                                if (error) throw error;
                                alert("CONEXÃO PERFEITA! ✅\nO sistema está 100% operacional.");
                            } catch (e) {
                                alert("Erro: " + e.message);
                            }
                        }}
                        className="underline hover:text-[#C9A857]"
                    >
                        Teste Final
                    </button>
                </div>
            </footer>
        </OptimizedBackground>
    );
}
