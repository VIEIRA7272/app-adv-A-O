import React from 'react';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';

export function SuccessPage({ data, onReset, onEdit }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-[#1E1E1E] p-8 rounded-lg border border-[#C9A857] shadow-2xl flex flex-col md:flex-row gap-8">

                {/* Coluna da Esquerda: Ações */}
                <div className="flex-1 flex flex-col items-center text-center justify-center">
                    <CheckCircle className="h-16 w-16 text-[#C9A857] mb-6" />
                    <h2 className="text-2xl text-white font-serif font-bold mb-2">Sucesso!</h2>
                    <p className="text-gray-400 mb-8">O documento e o vídeo foram processados.</p>

                    <div className="w-full space-y-4">
                        <a href={data.landingUrl} target="_blank" className="btn-gold w-full py-3 rounded font-bold block">
                            Visualizar Página do Cliente
                        </a>

                        <a href={data.pdf_final_url} target="_blank" className="flex items-center justify-center gap-2 text-[#C9A857] border border-[#C9A857] w-full py-3 rounded font-bold hover:bg-[#C9A857]/10 transition-colors">
                            <Download size={18} />
                            Baixar PDF com QR Code
                        </a>

                        <div className="flex gap-4 mt-4">
                            <button onClick={onEdit} className="flex-1 py-2 text-gray-400 hover:text-white border border-gray-600 rounded hover:border-gray-400 transition-colors">
                                Voltar / Corrigir
                            </button>
                            <button onClick={onReset} className="flex-1 py-2 text-gray-400 hover:text-white border border-gray-600 rounded hover:border-gray-400 transition-colors">
                                Novo Envio
                            </button>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Preview do PDF */}
                <div className="flex-1 bg-[#252525] rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                    <div className="bg-[#121212] p-2 border-b border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold pl-2">Preview do PDF</span>
                        <ExternalLink size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 relative min-h-[400px]">
                        <iframe
                            src={`${data.pdf_final_url}#toolbar=0&navpanes=0`}
                            className="absolute inset-0 w-full h-full"
                            title="PDF Preview"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
