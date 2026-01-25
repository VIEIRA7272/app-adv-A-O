import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';
import { AppConfig } from '../lib/app_config';

describe('Logo Component', () => {
    it('renders the logo image primarily', () => {
        render(<Logo />);
        const img = screen.getByAltText(AppConfig.officeName);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/logo-new.webp');
    });

    it('renders fallback text on image error', () => {
        render(<Logo />);
        const img = screen.getByAltText(AppConfig.officeName);

        // Simula erro no carregamento da imagem
        fireEvent.error(img);

        const text = screen.getByText(AppConfig.officeName);
        expect(text).toBeInTheDocument();
        expect(text).toHaveClass('font-serif');
    });

    it('adjusts size based on props', () => {
        const { rerender } = render(<Logo size="small" />);
        let img = screen.getByAltText(AppConfig.officeName);
        expect(img).toHaveClass('h-10');

        rerender(<Logo size="large" />);
        img = screen.getByAltText(AppConfig.officeName);
        expect(img).toHaveClass('h-32');
    });
});
