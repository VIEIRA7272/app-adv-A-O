import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { AppConfig } from '../lib/app_config';

export const Logo = ({ size = "normal" }) => {
    const [error, setError] = useState(false);
    const logoUrl = "/logo-new.webp";

    if (error) {
        return (
            <div className={cn("text-white font-serif font-bold tracking-widest uppercase border-2 border-[#E5B935] px-4 py-2 rounded-sm",
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
