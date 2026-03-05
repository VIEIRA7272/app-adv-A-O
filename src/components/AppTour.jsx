import React, { useEffect, useState, useCallback } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

// ============================================================
// Tour / Onboarding com Intro.js
// ============================================================
// Exibe um tour guiado para novos usuários no AdminDashboard.
// O tour só é disparado UMA VEZ (salva no localStorage).
// Para resetar o tour, use: localStorage.removeItem('app_tour_completed')
// ============================================================

const TOUR_STORAGE_KEY = 'app_tour_completed';

// Estilos customizados para combinar com o tema dark/gold do app
const customStyles = `
.introjs-tooltip {
    background: #1a1a1a !important;
    border: 1px solid rgba(201, 168, 87, 0.3) !important;
    border-radius: 16px !important;
    box-shadow: 0 0 40px rgba(201, 168, 87, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
    color: #e5e7eb !important;
    max-width: 380px !important;
    font-family: inherit !important;
}

.introjs-tooltip-title {
    color: #C9A857 !important;
    font-weight: 700 !important;
    font-size: 16px !important;
    padding: 12px 16px 0 !important;
    font-family: 'Georgia', serif !important;
}

.introjs-tooltiptext {
    color: #9ca3af !important;
    font-size: 13px !important;
    line-height: 1.6 !important;
    padding: 8px 16px !important;
}

.introjs-tooltipbuttons {
    border-top: 1px solid #333 !important;
    padding: 12px 16px !important;
}

.introjs-button {
    border: 1px solid #333 !important;
    background: #222 !important;
    color: #e5e7eb !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    padding: 6px 16px !important;
    text-shadow: none !important;
    transition: all 0.2s !important;
}

.introjs-button:hover {
    background: #333 !important;
    color: #fff !important;
}

.introjs-button:focus {
    box-shadow: 0 0 0 2px rgba(201, 168, 87, 0.3) !important;
}

.introjs-nextbutton {
    background: #C9A857 !important;
    color: #111 !important;
    border-color: #C9A857 !important;
    font-weight: 700 !important;
}

.introjs-nextbutton:hover {
    background: #b08d40 !important;
    border-color: #b08d40 !important;
}

.introjs-donebutton {
    background: #C9A857 !important;
    color: #111 !important;
    border-color: #C9A857 !important;
    font-weight: 700 !important;
}

.introjs-donebutton:hover {
    background: #b08d40 !important;
}

.introjs-skipbutton {
    color: #6b7280 !important;
    font-size: 11px !important;
}

.introjs-skipbutton:hover {
    color: #9ca3af !important;
}

.introjs-helperLayer {
    border-radius: 12px !important;
    box-shadow: 0 0 0 5000px rgba(5, 5, 5, 0.85) !important;
    border: 2px solid rgba(201, 168, 87, 0.4) !important;
}

.introjs-arrow.top {
    border-bottom-color: rgba(201, 168, 87, 0.3) !important;
}

.introjs-arrow.bottom {
    border-top-color: rgba(201, 168, 87, 0.3) !important;
}

.introjs-arrow.left {
    border-right-color: rgba(201, 168, 87, 0.3) !important;
}

.introjs-arrow.right {
    border-left-color: rgba(201, 168, 87, 0.3) !important;
}

.introjs-bullets ul li a {
    background: #333 !important;
}

.introjs-bullets ul li a.active {
    background: #C9A857 !important;
}

.introjs-progressbar {
    background: #C9A857 !important;
}

.introjs-progress {
    background: #222 !important;
}

/* Animação de entrada */
.introjs-tooltip {
    animation: tourFadeIn 0.3s ease-out !important;
}

@keyframes tourFadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

export function AppTour({ isAdmin = false, activeTab = 'upload' }) {
    const [tourReady, setTourReady] = useState(false);

    // Injeta estilos customizados
    useEffect(() => {
        const existingStyle = document.getElementById('introjs-custom-theme');
        if (!existingStyle) {
            const styleEl = document.createElement('style');
            styleEl.id = 'introjs-custom-theme';
            styleEl.textContent = customStyles;
            document.head.appendChild(styleEl);
        }
        return () => {
            const el = document.getElementById('introjs-custom-theme');
            if (el) el.remove();
        };
    }, []);

    // Verifica se o tour já foi completado
    useEffect(() => {
        const completed = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!completed) {
            // Delay para garantir que o DOM está carregado
            const timer = setTimeout(() => setTourReady(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const startTour = useCallback(() => {
        const steps = [
            {
                title: '👋 Bem-vindo ao Portal!',
                intro: 'Este é o seu painel de gestão de documentos jurídicos. Vou te mostrar como usar cada funcionalidade em poucos segundos.',
            },
            {
                element: '[data-tour="tab-upload"]',
                title: '📤 Novo Processo',
                intro: 'Clique aqui para criar um novo processo. Você poderá enviar o vídeo explicativo e o PDF do documento para seu cliente.',
                position: 'bottom',
            },
            {
                element: '[data-tour="tab-processos"]',
                title: '📊 Monitoramento',
                intro: 'Acompanhe todos os processos enviados. Veja quantas vezes cada documento foi visualizado e o histórico de acessos.',
                position: 'bottom',
            },
        ];

        // Adiciona step do tab Equipe se for admin
        if (isAdmin) {
            steps.push({
                element: '[data-tour="tab-equipe"]',
                title: '👥 Equipe',
                intro: 'Como administrador, você pode adicionar e gerenciar membros da equipe, definir permissões e remover acessos.',
                position: 'bottom',
            });
        }

        // Step do logout
        steps.push({
            element: '[data-tour="btn-logout"]',
            title: '🚪 Sair',
            intro: 'Use este botão para encerrar sua sessão com segurança.',
            position: 'left',
        });

        // Step final motivacional
        steps.push({
            title: '✅ Tudo Pronto!',
            intro: 'Agora você está pronto para gerenciar seus documentos! Comece fazendo upload de um novo processo. Se precisar rever o tour, use o botão "?" no canto inferior.',
        });

        const intro = introJs();
        intro.setOptions({
            steps,
            showProgress: true,
            showBullets: true,
            showStepNumbers: false,
            exitOnOverlayClick: false,
            disableInteraction: true,
            doneLabel: 'Começar! 🚀',
            nextLabel: 'Próximo →',
            prevLabel: '← Anterior',
            skipLabel: 'Pular tour',
            scrollToElement: true,
            scrollPadding: 80,
        });

        intro.oncomplete(() => {
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        });

        intro.onexit(() => {
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        });

        intro.start();
    }, [isAdmin]);

    // Auto-start para novos usuários
    useEffect(() => {
        if (tourReady && activeTab === 'upload') {
            startTour();
        }
    }, [tourReady, activeTab, startTour]);

    // Botão flutuante para reiniciar o tour
    return (
        <button
            onClick={() => {
                localStorage.removeItem(TOUR_STORAGE_KEY);
                startTour();
            }}
            data-tour="help-button"
            className="fixed bottom-6 right-6 z-30 w-10 h-10 bg-[#1a1a1a] hover:bg-[#C9A857] text-[#C9A857] hover:text-[#111] border border-[#C9A857]/30 hover:border-[#C9A857] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/30 hover:shadow-[#C9A857]/20 hover:scale-110 group"
            title="Rever o tour guiado"
        >
            <span className="text-lg font-bold group-hover:animate-bounce">?</span>
        </button>
    );
}
