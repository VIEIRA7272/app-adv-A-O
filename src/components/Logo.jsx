import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { AppConfig } from '../lib/app_config';

export const Logo = ({ size = "normal" }) => {
    const [error, setError] = useState(false);
    const logoUrl = "https://kwzejxqfkmagbrbrymgd.supabase.co/storage/v1/object/public/logo/logo3%20ALMEIDA%20E%20OLOVEIRA%20ADV.webp";

    if (error) {
        return (
            <div className={cn("text-white font-serif font-bold tracking-widest uppercase border-2 border-[#C9A857] px-4 py-2 rounded-sm",
                size === "large" ? "text-3xl" : size === "small" ? "text-sm" : "text-xl"
            )}>
                {AppConfig.officeName}
            </div>
        );
    }

    return (
        <img
            src={logoUrl}
            alt={AppConfig.officeName}
            className={cn("object-contain transition-opacity duration-300",
                size === "large" ? "h-32" : size === "small" ? "h-10" : "h-20"
            )}
            onError={() => setError(true)}
        />
    );
};
