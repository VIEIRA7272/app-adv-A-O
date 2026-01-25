import React, { useState, useEffect } from 'react';

/**
 * Componente de Background Otimizado
 * - Mostra gradiente imediatamente (instantâneo)
 * - Carrega imagem em background (sem bloquear)
 * - Faz transição suave quando imagem carrega
 */
export function OptimizedBackground({ imageSrc, children, className = "", overlayClass = "bg-black/70" }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showImage, setShowImage] = useState(false);

    useEffect(() => {
        // Só tenta carregar a imagem se não for mobile com conexão lenta
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
        const isMobile = window.innerWidth < 768;

        // Em mobile com conexão lenta, não carrega a imagem pesada
        if (isMobile && isSlowConnection) {
            return;
        }

        // Carrega a imagem em background
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            setImageLoaded(true);
            // Delay para transição suave
            setTimeout(() => setShowImage(true), 100);
        };
        img.onerror = () => {
            // Falha silenciosa - continua com gradiente
            console.warn('Background image failed to load, using gradient fallback');
        };
    }, [imageSrc]);

    return (
        <div className={`relative ${className}`}>
            {/* Gradiente base - sempre visível inicialmente */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]"
                style={{
                    opacity: showImage ? 0 : 1,
                    transition: 'opacity 0.5s ease-out'
                }}
            >
                {/* Padrão decorativo sutil */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A857] rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C9A857] rounded-full blur-[120px]"></div>
                </div>
            </div>

            {/* Imagem de fundo - aparece quando carregada */}
            {imageLoaded && (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('${imageSrc}')`,
                        opacity: showImage ? 1 : 0,
                        transition: 'opacity 0.5s ease-out'
                    }}
                />
            )}

            {/* Overlay escuro para legibilidade */}
            <div className={`absolute inset-0 ${overlayClass} z-[1]`}></div>

            {/* Conteúdo renderizado diretamente */}
            {children}
        </div>
    );
}

/**
 * Versão simplificada - apenas gradiente (sem imagem)
 * Usar quando performance é crítica
 */
export function GradientBackground({ children, className = "" }) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A857] rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C9A857] rounded-full blur-[120px]"></div>
                </div>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
