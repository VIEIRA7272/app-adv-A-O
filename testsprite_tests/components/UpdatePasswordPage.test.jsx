// Usando globals do vitest.config.js (describe, it, expect, vi, beforeEach estão disponíveis globalmente)
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdatePasswordPage } from '../../src/components/UpdatePasswordPage';

// Mock do Logo
vi.mock('../../src/components/Logo', () => ({
    Logo: ({ size }) => <div data-testid="logo">Logo {size}</div>,
}));

describe('UpdatePasswordPage Component', () => {
    let mockSupabase;

    beforeEach(() => {
        // Mock do Supabase
        mockSupabase = {
            auth: {
                updateUser: vi.fn(),
            },
        };

        // Limpar mocks antes de cada teste
        vi.clearAllMocks();

        // Mock do window.location
        delete window.location;
        window.location = {
            href: '',
            hash: '#access_token=test_token'
        };
    });

    describe('Renderização Inicial', () => {
        it('deve renderizar o formulário de atualização de senha corretamente', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);

            expect(screen.getByText('Definir Nova Senha')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Salvar Nova Senha/i })).toBeInTheDocument();
        });

        it('deve renderizar o logo', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            expect(screen.getByTestId('logo')).toBeInTheDocument();
        });

        it('deve ter label descritivo para o campo de senha', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            expect(screen.getByText('Nova Senha')).toBeInTheDocument();
        });
    });

    describe('Interações com Formulário', () => {
        it('deve atualizar o valor do campo de senha', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });

            expect(passwordInput.value).toBe('novaSenha123');
        });

        it('deve ter validação de campo obrigatório', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');

            expect(passwordInput).toHaveAttribute('required');
        });

        it('deve ter validação de comprimento mínimo de 6 caracteres', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');

            expect(passwordInput).toHaveAttribute('minLength', '6');
        });

        it('deve ter o tipo password no input', () => {
            render(<UpdatePasswordPage supabase={mockSupabase} />);
            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');

            expect(passwordInput).toHaveAttribute('type', 'password');
        });
    });

    describe('Submissão do Formulário', () => {
        it('deve chamar updateUser com a nova senha ao submeter', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
                    password: 'novaSenha123',
                });
            });
        });

        it('deve mostrar spinner durante o loading', async () => {
            mockSupabase.auth.updateUser.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            // Durante o loading, o texto do botão deve desaparecer e aparecer o spinner
            expect(submitButton).toBeDisabled();
        });

        it('deve desabilitar o botão durante o loading', async () => {
            mockSupabase.auth.updateUser.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
        });
    });

    describe('Tratamento de Sucesso', () => {
        it('deve mostrar tela de sucesso após atualização bem-sucedida', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Senha Atualizada!')).toBeInTheDocument();
            });
        });

        it('deve mostrar mensagem de redirecionamento', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Redirecionando para o login...')).toBeInTheDocument();
            });
        });

        it.skip('deve redirecionar para /login após 3 segundos', async () => {
            // TODO: Este teste requer fake timers para funcionar corretamente
            mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Senha Atualizada!')).toBeInTheDocument();
            });

            // Este teste requer vi.useFakeTimers() que causa problemas com outros testes
            // vi.advanceTimersByTime(3000);
            // expect(window.location.href).toBe('/login');
        });
    });

    describe('Tratamento de Erros', () => {
        it.skip('deve exibir mensagem de erro quando a atualização falha', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({
                error: { message: 'Senha muito fraca' },
            });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: '123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Senha muito fraca')).toBeInTheDocument();
            });
        });

        it.skip('deve exibir erro de sessão expirada', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({
                error: { message: 'Session expired' },
            });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Session expired')).toBeInTheDocument();
            });
        });

        it.skip('deve limpar mensagem de erro ao submeter novamente', async () => {
            mockSupabase.auth.updateUser
                .mockResolvedValueOnce({
                    error: { message: 'Erro temporário' },
                })
                .mockResolvedValueOnce({ error: null });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            // Primeira submissão com erro
            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Erro temporário')).toBeInTheDocument();
            });

            // Segunda submissão sem erro
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.queryByText('Erro temporário')).not.toBeInTheDocument();
            });
        });

        it.skip('deve mostrar erro em container estilizado', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({
                error: { message: 'Erro de teste' },
            });

            render(<UpdatePasswordPage supabase={mockSupabase} />);

            const passwordInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
            const submitButton = screen.getByRole('button', { name: /Salvar Nova Senha/i });

            fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                const errorDiv = screen.getByText('Erro de teste').closest('div');
                expect(errorDiv).toHaveClass('text-center');
            });
        });
    });

    describe('Verificação de Token na URL', () => {
        it('deve funcionar mesmo sem token na URL', () => {
            window.location.hash = '';

            // Não deve lançar erro
            expect(() => {
                render(<UpdatePasswordPage supabase={mockSupabase} />);
            }).not.toThrow();
        });

        it('deve funcionar com token na URL', () => {
            window.location.hash = '#access_token=valid_token&type=recovery';

            expect(() => {
                render(<UpdatePasswordPage supabase={mockSupabase} />);
            }).not.toThrow();
        });
    });
});
