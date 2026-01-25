import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';
import { Loader2, Move, AlertTriangle } from 'lucide-react';

// Configuração do Worker do PDF (Essencial para produção)
// Usando unpkg CDN para garantir que o worker seja carregado corretamente
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[70] bg-[#1a1a1a] flex flex-col items-center justify-center p-8 text-white">
                    <AlertTriangle size={64} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
                    <p className="text-gray-400 mb-4">Ocorreu um erro ao tentar exibir o editor.</p>
                    <div className="bg-black/50 p-4 rounded border border-gray-700 max-w-2xl overflow-auto max-h-[300px] mb-6 w-full">
                        <p className="text-red-400 font-mono text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-gray-500 text-xs">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-gold px-6 py-2 rounded"
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

function PdfVisualEditorContent({ pdfFile, qrCodeDataUrl, onSave, onCancel }) {
    const [numPages, setNumPages] = useState(null);
    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 }); // Dimensões originais do PDF (pontos)
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [error, setError] = useState(null);
    const containerRef = useRef(null);
    const draggableRef = useRef(null); // Ref para o elemento arrastável

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setError(null);
    }

    function onDocumentLoadError(err) {
        console.error("Erro ao carregar PDF:", err);
        setError("Erro ao carregar o PDF. Tente novamente ou verifique o arquivo.");
    }

    function onPageLoadSuccess(page) {
        setPageWidth(page.width);
        setPageHeight(page.height);
        setPdfDimensions({ width: page.originalWidth, height: page.originalHeight });
        // Inicializa no centro
        setPosition({ x: page.width / 2 - 40, y: page.height / 2 - 40 });
    }

    const handleStop = (e, data) => {
        setPosition({ x: data.x, y: data.y });
    };

    const handleConfirm = () => {
        // Calcular a proporção entre o tamanho renderizado e o tamanho original do PDF
        const scaleX = pdfDimensions.width / pageWidth;
        const scaleY = pdfDimensions.height / pageHeight;

        // Coordenadas no PDF (pdf-lib usa origem no canto INFERIOR esquerdo)
        // Mas react-pdf/DOM usa origem no canto SUPERIOR esquerdo.
        // Então y_pdf = height_pdf - (y_dom * scaleY) - (height_qr * scaleY)

        const qrSizeDom = 80; // Tamanho visual do QR Code
        const qrSizePdf = 80; // Tamanho real que vamos desenhar no PDF

        // Ajuste: Garantir que x e y não sejam negativos
        const safeX = Math.max(0, position.x);
        const safeY = Math.max(0, position.y);

        const finalX = safeX * scaleX;
        let finalY = pdfDimensions.height - (safeY * scaleY) - (qrSizePdf);

        // Margem de segurança inferior para o texto do link não ficar fora da página
        // O texto fica ~25 pontos abaixo do QR code.
        if (finalY < 40) finalY = 40;

        onSave({ x: finalX, y: finalY });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#E5B935] w-full max-w-5xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl text-[#C9A857] font-bold flex items-center gap-2">
                        <Move size={20} /> Arraste o QR Code para a posição desejada
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                        <button onClick={handleConfirm} className="btn-gold px-6 py-2 rounded font-bold">Confirmar Posição</button>
                    </div>
                </div>

                {/* Container principal com scroll */}
                <div className="flex-1 overflow-auto bg-gray-900 flex justify-center p-8 border border-gray-700" ref={containerRef}>
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400">
                            <AlertTriangle size={48} className="mb-4" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        /* Wrapper Relativo com o tamanho exato da página */
                        <div className="relative shadow-2xl" style={{ width: pageWidth ? pageWidth : 'auto', height: pageHeight ? pageHeight : 'auto' }}>
                            <Document
                                file={pdfFile}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={<div className="text-white p-10 flex items-center"><Loader2 className="animate-spin mr-2" /> Carregando PDF...</div>}
                            >
                                <Page
                                    pageNumber={1}
                                    onLoadSuccess={onPageLoadSuccess}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    width={Math.min(window.innerWidth - 40, 600)} // Responsivo: Largura da tela menos margem, ou máx 600
                                />
                            </Document>

                            {pageWidth > 0 && !error && (
                                <Draggable
                                    bounds="parent"
                                    position={position}
                                    onStop={handleStop}
                                    nodeRef={draggableRef}
                                >
                                    <div
                                        ref={draggableRef}
                                        className="absolute top-0 left-0 cursor-move z-10 group flex flex-col items-center"
                                        style={{ width: 80, height: 'auto', touchAction: 'none' }} // Altura automática para incluir texto
                                    >
                                        <div className="w-full h-20 border-2 border-[#C9A857] bg-white p-1 shadow-xl relative shrink-0">
                                            <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" draggable={false} />
                                        </div>
                                        {/* Texto agora faz parte do fluxo do container */}
                                        <div className="w-[120px] text-center mt-1 bg-white/80 backdrop-blur-sm rounded px-1 py-0.5">
                                            <div className="text-[6px] text-black font-bold whitespace-nowrap">Acesse o vídeo:</div>
                                            <div className="text-[5px] text-blue-600 truncate font-medium">link...</div>
                                        </div>
                                    </div>
                                </Draggable>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-center text-gray-500 text-sm mt-2">Mostrando apenas a primeira página para posicionamento.</p>
            </div>
        </div>
    );
}

import { createPortal } from 'react-dom';

export function PdfVisualEditor({ pdfFile, qrCodeDataUrl, onSave, onCancel }) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <ErrorBoundary>
            <PdfVisualEditorContent
                pdfFile={pdfFile}
                qrCodeDataUrl={qrCodeDataUrl}
                onSave={onSave}
                onCancel={onCancel}
            />
        </ErrorBoundary>,
        document.body
    );
}
