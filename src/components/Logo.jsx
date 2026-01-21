import React from 'react';
import { cn } from '../lib/utils';
import { AppConfig } from '../lib/app_config';

export const Logo = ({ size = "normal" }) => {
    // Se tiver URL de logo na config, usa imagem. Senão, usa texto.
    // Como ainda não adicionei logoUrl na config, vou deixar hardcoded por enquanto mas preparado

    return (
        <img
            src="https://kwzejxqfkmagbrbrymgd.supabase.co/storage/v1/object/public/logo/logo3%20ALMEIDA%20E%20OLOVEIRA%20ADV.webp"
            alt={AppConfig.officeName}
            className={cn("object-contain", size === "large" ? "h-40" : size === "small" ? "h-12" : "h-24")}
        />
    );
};
