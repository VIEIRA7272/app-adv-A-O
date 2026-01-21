import React from 'react';
import { cn } from '../lib/utils';
import { AppConfig } from '../lib/app_config';

export const Logo = ({ size = "normal" }) => {
    // Se tiver URL de logo na config, usa imagem. Senão, usa texto.
    // Como ainda não adicionei logoUrl na config, vou deixar hardcoded por enquanto mas preparado

    return (
        <div className={cn("text-white font-serif font-bold tracking-widest uppercase border-2 border-[#C9A857] px-4 py-2 rounded-sm",
            size === "large" ? "text-3xl" : size === "small" ? "text-sm" : "text-xl"
        )}>
            {AppConfig.officeName}
        </div>
    );
};
