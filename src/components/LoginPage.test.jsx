import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { BrowserRouter } from 'react-router-dom';

// Mock do supabase e hooks
const mockSupabase = {
    auth: {
        signInWithPassword: vi.fn(),
    },
};

// Mock do OptimizedBackground para não carregar imagens pesadas no teste
vi.mock('./OptimizedBackground', () => ({
    OptimizedBackground: ({ children }) => <div data-testid="background">{children}</div>,
}));

// Mock do Logo
vi.mock('./Logo', () => ({
    Logo: () => <div>MockLogo</div>,
}));

describe('LoginPage Component', () => {
    it('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <LoginPage supabase={mockSupabase} />
            </BrowserRouter>
        );

        expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('usuario@escritorio.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /acessar painel/i })).toBeInTheDocument();
    });

    it('updates input values on change', () => {
        render(
            <BrowserRouter>
                <LoginPage supabase={mockSupabase} />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText('usuario@escritorio.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');

        fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
        fireEvent.change(passwordInput, { target: { value: 'senha123' } });

        expect(emailInput.value).toBe('teste@email.com');
        expect(passwordInput.value).toBe('senha123');
    });
});
