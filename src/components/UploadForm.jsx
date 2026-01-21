import React, { useState } from 'react';
import { Upload, FileText, Video, Loader2, FileCheck, AlertTriangle, Lock, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { PdfVisualEditor } from './PdfVisualEditor';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';

export function UploadForm({ onSuccess, supabase }) {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [processo, setProcesso] = useState("");
    const [titulo, setTitulo] = useState("");
    const [password, setPassword] = useState("");
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
                        throw new Error("O arquivo é maior que o limite permitido pelo banco de dados.");
                    }
                    throw new Error(`Erro Resgate (${res.status}): ${text}`);
                }
                return { path: path };
            }
            throw err;
        }
    };

    const handleInitialProcess = async () => {
        if (!processo || !pdfFile || !videoFile) { setErrorMsg("Por favor, preencha todos os campos e anexe os arquivos."); return; }
        setLoading(true); setErrorMsg(null);
        try {
            const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
            const landingUrl = `${window.location.origin}?v=${slug}`;

            setStatusMsg("Verificando arquivo...");
            const LIMIT_MB = 50;
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            if (videoFile.size > LIMIT_BYTES) {
                const sizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
                setErrorMsg(`O vídeo tem ${sizeMB}MB (Limite: 50MB). Por favor, comprima o arquivo antes de enviar.`);
                setLoading(false);
                return;
            }

            setStatusMsg("Enviando vídeo...");
            const fileExt = videoFile.name.split('.').pop() || 'mp4';
            const safeRandomName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
            const videoPath = `videos/${slug}_${safeRandomName}`;

            await robustUpload('videos-final-v3', videoPath, videoFile);
            const { data: videoUrlData } = supabase.storage.from('videos-final-v3').getPublicUrl(videoPath);

            setStatusMsg("Gerando QR Code...");
            const qrCodeDataUrl = await QRCode.toDataURL(landingUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });

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

            firstPage.drawText('Acesse o vídeo:', {
                x: x, y: y - 12, size: 9, font: helveticaFont, color: rgb(0, 0, 0),
            });

            const displayUrl = landingUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
            const linkFontSize = 8;
            const textWidth = helveticaFont.widthOfTextAtSize(displayUrl, linkFontSize);
            const textHeight = helveticaFont.heightAtSize(linkFontSize);

            firstPage.drawText(displayUrl, {
                x: x, y: y - 22, size: linkFontSize, font: helveticaFont, color: rgb(0, 0, 1),
            });

            firstPage.drawLine({
                start: { x: x, y: y - 23 }, end: { x: x + textWidth, y: y - 23 }, thickness: 0.5, color: rgb(0, 0, 1),
            });

            const linkAnnotation = pdfDoc.context.register(
                pdfDoc.context.obj({
                    Type: 'Annot', Subtype: 'Link',
                    Rect: [x, y - 25, x + textWidth, y - 22 + textHeight + 2],
                    Border: [0, 0, 0], C: [0, 0, 1],
                    A: { Type: 'Action', S: 'URI', URI: landingUrl },
                })
            );

            const existingAnnots = firstPage.node.Annots();
            if (existingAnnots) existingAnnots.push(linkAnnotation);
            else firstPage.node.set(PDFDocument.PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));

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
                access_password: password || null
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

    return (
        <div className="animate-fade-in-up py-10 px-4 md:px-8">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 items-start">

                {/* Left Sidebar: Context & Steps (15%) */}
                <div className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
                    {/* Welcome / Context */}
                    <div className="p-5 rounded-2xl border border-[#E5B935]/20 bg-[#111]/50 backdrop-blur-sm shadow-lg shadow-[#C9A857]/5">
                        <h3 className="text-[#C9A857] font-serif font-bold text-xl mb-3 flex items-center gap-2">
                            Excelência Jurídica
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            O sistema utiliza tecnologia digital avançada para processar seus arquivos com segurança e rapidez.
                        </p>
                    </div>

                    {/* Step by Step */}
                    <div className="p-5 rounded-2xl border border-[#333] bg-[#1a1a1a]/80 backdrop-blur-sm">
                        <h3 className="text-[#C9A857] font-serif font-bold text-lg mb-4">Passo a Passo</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C9A857]/20 text-[#C9A857] flex items-center justify-center text-xs font-bold border border-[#C9A857]/30">1</span>
                                <p className="text-gray-300 text-sm">Preencha o número do processo (formato CNJ).</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C9A857]/20 text-[#C9A857] flex items-center justify-center text-xs font-bold border border-[#C9A857]/30">2</span>
                                <p className="text-gray-300 text-sm">Anexe o PDF da peça processual.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C9A857]/20 text-[#C9A857] flex items-center justify-center text-xs font-bold border border-[#C9A857]/30">3</span>
                                <p className="text-gray-300 text-sm">Grave ou faça upload do vídeo.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Form (70%) */}
                <div className="">
                    <div className="bg-[#111] border border-[#C9A857]/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(201,168,87,0.08)] relative overflow-hidden">

                        {/* Decorative Top Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A857] to-transparent"></div>

                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-4 bg-[#C9A857]/10 rounded-full mb-5 text-[#C9A857] shadow-[0_0_25px_rgba(201,168,87,0.15)] ring-1 ring-[#C9A857]/40 ring-offset-4 ring-offset-[#111]">
                                <Upload size={32} />
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-[#C9A857] mb-2 tracking-wide">
                                Novo Processo
                            </h2>
                            <p className="text-gray-400 max-w-lg mx-auto text-xs font-light tracking-[0.2em] uppercase">
                                Preencha os dados e anexe os arquivos
                            </p>
                        </div>

                        {/* Error Box */}
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center animate-pulse gap-3">
                                <AlertTriangle className="shrink-0" size={20} />
                                <span className="font-medium">{errorMsg}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-[#C9A857] uppercase tracking-wider pl-1">
                                        Número do Processo
                                        <div className="group relative cursor-help">
                                            <HelpCircle size={14} className="text-gray-500 hover:text-[#C9A857] transition-colors" />
                                            <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-[#222] border border-[#C9A857]/30 text-gray-300 text-[10px] normal-case p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                                                Use o formato CNJ padrão de 20 dígitos para garantir a busca correta.
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#C9A857]/30"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={processo}
                                            onChange={e => setProcesso(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white outline-none focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] transition-all font-mono placeholder-gray-600 pl-10"
                                            placeholder="0000000-00.0000.0.00.0000"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#C9A857] transition-colors">
                                            <FileText size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-[#C9A857] uppercase tracking-wider pl-1">
                                        Nome do Cliente / Título da Peça
                                        <div className="group relative cursor-help">
                                            <HelpCircle size={14} className="text-gray-500 hover:text-[#C9A857] transition-colors" />
                                            <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#222] border border-[#C9A857]/30 text-gray-300 text-[10px] normal-case p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                                                Coloque o nome do cliente aqui para facilitar a busca no painel depois (ex: Maria Silva - Habeas Corpus).
                                                <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-[#C9A857]/30"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={titulo}
                                            onChange={e => setTitulo(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white outline-none focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] transition-all placeholder-gray-600 pl-4"
                                            placeholder="Ex: Petição Inicial"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="p-1 bg-gradient-to-r from-[#C9A857]/20 to-transparent rounded-xl">
                                <div className="p-5 bg-[#181818] rounded-lg border border-[#333] relative">
                                    <label className="text-xs font-bold text-[#C9A857] uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Lock size={14} /> Proteger com Senha
                                        <div className="group relative cursor-help">
                                            <HelpCircle size={14} className="text-gray-500 hover:text-[#C9A857] transition-colors" />
                                            <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-56 bg-[#222] border border-[#C9A857]/30 text-gray-300 text-[10px] normal-case p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                                                Defina uma senha que o cliente deverá digitar para acessar o vídeo. Se deixar em branco, o acesso será livre.
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#C9A857]/30"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-[#111] border border-[#333] text-white rounded-lg outline-none focus:border-[#C9A857] transition-all placeholder-gray-600 text-sm"
                                        placeholder="Defina uma senha..."
                                    />
                                </div>
                            </div>

                            {/* Dropzones - Stacked on Mobile, Grid on Large */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* PDF Dropzone */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-[#C9A857] uppercase tracking-wider">Documento PDF</label>
                                    <div
                                        className={cn(
                                            "h-40 border border-dashed border-[#444] rounded-xl flex flex-col items-center justify-center text-center p-4 bg-[#1a1a1a] transition-all cursor-pointer hover:bg-[#222] hover:border-[#C9A857]/50 group relative overflow-hidden",
                                            dragActive === 'pdf' ? "border-[#C9A857] bg-[#C9A857]/10" : "",
                                            pdfFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'pdf')}
                                        onDragLeave={(e) => handleDrag(e, 'pdf')}
                                        onDragOver={(e) => handleDrag(e, 'pdf')}
                                        onDrop={(e) => handleDrop(e, 'pdf')}
                                        onClick={() => document.getElementById('form-pdf-upload').click()}
                                    >
                                        <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="form-pdf-upload" />
                                        {pdfFile ? (
                                            <div className="flex flex-col items-center animate-fade-in z-10">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                                    <FileCheck size={20} />
                                                </div>
                                                <span className="text-emerald-400 font-medium text-xs truncate max-w-[150px]">{pdfFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300 z-10">
                                                <div className="w-10 h-10 rounded-full bg-[#111] text-gray-500 flex items-center justify-center mb-2 group-hover:bg-[#C9A857] group-hover:text-[#111] transition-all duration-300 border border-[#333] shadow-lg">
                                                    <FileText size={20} />
                                                </div>
                                                <p className="text-gray-300 font-medium text-xs">PDF do Processo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Video Dropzone */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-[#C9A857] uppercase tracking-wider">Vídeo Explicativo</label>
                                    <div
                                        className={cn(
                                            "h-40 border border-dashed border-[#444] rounded-xl flex flex-col items-center justify-center text-center p-4 bg-[#1a1a1a] transition-all cursor-pointer hover:bg-[#222] hover:border-[#C9A857]/50 group relative overflow-hidden",
                                            dragActive === 'video' ? "border-[#C9A857] bg-[#C9A857]/10" : "",
                                            videoFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'video')}
                                        onDragLeave={(e) => handleDrag(e, 'video')}
                                        onDragOver={(e) => handleDrag(e, 'video')}
                                        onDrop={(e) => handleDrop(e, 'video')}
                                        onClick={() => document.getElementById('form-video-upload').click()}
                                    >
                                        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="hidden" id="form-video-upload" />
                                        {videoFile ? (
                                            <div className="flex flex-col items-center animate-fade-in z-10">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                                    <Video size={20} />
                                                </div>
                                                <span className="text-emerald-400 font-medium text-xs truncate max-w-[150px]">{videoFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300 z-10">
                                                <div className="w-10 h-10 rounded-full bg-[#111] text-gray-500 flex items-center justify-center mb-2 group-hover:bg-[#C9A857] group-hover:text-[#111] transition-all duration-300 border border-[#333] shadow-lg">
                                                    <Video size={20} />
                                                </div>
                                                <p className="text-gray-300 font-medium text-xs">Arquivo de Vídeo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleInitialProcess}
                                disabled={loading}
                                className="w-full btn-gold py-4 rounded-xl text-lg shadow-[0_10px_40px_-10px_rgba(201,168,87,0.3)] mt-6 uppercase tracking-widest font-bold btn-shimmer hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-[#C9A857]/20"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" /> Processando...</>
                                ) : (
                                    <>Continuar <ChevronRight size={20} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Security & Tips (15%) */}
                <div className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
                    {/* Security Card */}
                    <div className="p-5 rounded-2xl border border-[#C9A857]/20 bg-[#111]/50 backdrop-blur-sm">
                        <h3 className="text-[#C9A857] font-serif font-bold text-xl mb-3 flex items-center gap-2">
                            <Lock size={20} /> Segurança Digital
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Acesso restrito e protegido por senha. Seus arquivos são armazenados em ambiente seguro monitorado.
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="p-5 rounded-2xl border border-[#333] bg-[#1a1a1a]/80 backdrop-blur-sm">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={16} className="text-[#C9A857]" /> Recomendação
                        </h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Vídeos na horizontal (16:9). Ambiente iluminado e silencioso.
                        </p>
                    </div>
                </div>


            </div>
        </div>
    );
}
