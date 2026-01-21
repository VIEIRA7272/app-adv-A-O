import React, { useState } from 'react';
import { Upload, FileText, Video, Loader2, FileCheck, AlertTriangle, Lock, X } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { PdfVisualEditor } from './PdfVisualEditor';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';

export function UploadModal({ isOpen, onClose, onSuccess, supabase }) {
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

    if (!isOpen) return null;

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
            onClose(); // Fecha o modal após o sucesso
        } catch (error) {
            console.error(error);
            setErrorMsg("Erro ao finalizar PDF: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Render PdfVisualEditor directly if needed
    if (showVisualEditor) {
        return (
            <PdfVisualEditor
                pdfFile={pdfFile}
                qrCodeDataUrl={generatedQrData}
                onSave={handleFinalizePdf}
                onCancel={() => { setShowVisualEditor(false); setLoading(false); }}
            />
        );
    }

    // Default Modal Content
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1E1E1E] border border-[#E5B935]/50 rounded-lg w-full max-w-2xl shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header */}
                <div className="p-6 border-b border-[#333] flex justify-between items-center sticky top-0 bg-[#1E1E1E] z-10">
                    <h2 className="text-xl font-serif font-bold text-[#C9A857] flex items-center gap-2">
                        <Upload size={20} />
                        Novo Processo
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Box */}
                    {errorMsg && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center animate-pulse">
                            <AlertTriangle className="mr-2 shrink-0" size={16} /> {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Número do Processo</label>
                            <input
                                type="text"
                                value={processo}
                                onChange={e => setProcesso(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] px-4 py-3 rounded-lg text-white outline-none focus:border-[#C9A857] transition-colors"
                                placeholder="0000000-00.0000.0.00.0000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título (Opcional)</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] px-4 py-3 rounded-lg text-white outline-none focus:border-[#C9A857] transition-colors"
                                placeholder="Ex: Contestação"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Lock size={12} className="text-[#C9A857]" /> Senha de Acesso (Opcional)
                        </label>
                        <input
                            type="text"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#121212] border border-[#333] px-4 py-3 rounded-lg text-white outline-none focus:border-[#C9A857] transition-colors placeholder-gray-600"
                            placeholder="Proteja o acesso ao vídeo se desejar"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PDF Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PDF do Processo</label>
                            <div
                                className={cn(
                                    "border border-dashed border-[#444] rounded-xl p-6 text-center bg-[#121212] transition-all hover:bg-[#1a1a1a] cursor-pointer relative",
                                    dragActive === 'pdf' ? "border-[#C9A857] bg-[#C9A857]/10" : "",
                                    pdfFile && "border-green-500/50 bg-green-900/10"
                                )}
                                onDragEnter={(e) => handleDrag(e, 'pdf')}
                                onDragLeave={(e) => handleDrag(e, 'pdf')}
                                onDragOver={(e) => handleDrag(e, 'pdf')}
                                onDrop={(e) => handleDrop(e, 'pdf')}
                                onClick={() => document.getElementById('modal-pdf-upload').click()}
                            >
                                <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="modal-pdf-upload" />
                                {pdfFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileCheck size={32} className="text-green-500 mb-2" />
                                        <span className="text-green-500 text-xs font-bold truncate max-w-full">{pdfFile.name}</span>
                                        <div className="absolute top-2 right-2 p-1 bg-[#121212] rounded-full border border-[#333] hover:text-red-400" onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}>
                                            <X size={12} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FileText size={24} className="text-gray-500 mb-2" />
                                        <span className="text-gray-400 text-xs">Arraste ou Clique</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vídeo Explicativo</label>
                            <div
                                className={cn(
                                    "border border-dashed border-[#444] rounded-xl p-6 text-center bg-[#121212] transition-all hover:bg-[#1a1a1a] cursor-pointer relative",
                                    dragActive === 'video' ? "border-[#C9A857] bg-[#C9A857]/10" : "",
                                    videoFile && "border-green-500/50 bg-green-900/10"
                                )}
                                onDragEnter={(e) => handleDrag(e, 'video')}
                                onDragLeave={(e) => handleDrag(e, 'video')}
                                onDragOver={(e) => handleDrag(e, 'video')}
                                onDrop={(e) => handleDrop(e, 'video')}
                                onClick={() => document.getElementById('modal-video-upload').click()}
                            >
                                <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="hidden" id="modal-video-upload" />
                                {videoFile ? (
                                    <div className="flex flex-col items-center">
                                        <Video size={32} className="text-green-500 mb-2" />
                                        <span className="text-green-500 text-xs font-bold truncate max-w-full">{videoFile.name}</span>
                                        <div className="absolute top-2 right-2 p-1 bg-[#121212] rounded-full border border-[#333] hover:text-red-400" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>
                                            <X size={12} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Video size={24} className="text-gray-500 mb-2" />
                                        <span className="text-gray-400 text-xs">Arraste ou Clique</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleInitialProcess}
                        disabled={loading}
                        className="w-full btn-gold py-4 rounded-lg text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-[#C9A857]/20 transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? <><Loader2 className="animate-spin" /> {statusMsg || "Processando..."}</> : "Continuar para Posicionamento"}
                    </button>
                </div>
            </div>
        </div>
    );
}
