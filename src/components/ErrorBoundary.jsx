
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
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
                <div className="min-h-screen bg-[#111] text-white flex items-center justify-center p-8 font-sans">
                    <div className="max-w-2xl bg-red-900/20 border border-red-500/50 p-8 rounded-lg shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-500 rounded-full text-white">
                                <AlertTriangle size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-red-100">Erro de Renderização</h1>
                        </div>
                        <p className="text-gray-300 mb-4">Ocorreu um erro inesperado ao exibir esta página.</p>

                        <div className="bg-black/50 p-4 rounded overflow-auto text-xs font-mono border border-white/10 max-h-64 mb-6">
                            <p className="text-red-300 font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="text-gray-500">{this.state.errorInfo?.componentStack}</pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
