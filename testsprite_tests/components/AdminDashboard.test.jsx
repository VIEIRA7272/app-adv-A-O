// Usando globals do vitest.config.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../../src/components/AdminDashboard';

// Mock do Logo
vi.mock('../../src/components/Logo', () => ({
    Logo: ({ size }) => <div data-testid="logo">Logo {size}</div>,
}));

// Mock do OptimizedBackground
vi.mock('../../src/components/OptimizedBackground', () => ({
    OptimizedBackground: ({ children }) => <div data-testid="optimized-background">{children}</div>,
}));

// Mock do UploadForm
vi.mock('../../src/components/UploadForm', () => ({
    UploadForm: ({ onSuccess }) => (
        <div data-testid="upload-form">
            <button onClick={onSuccess}>Simular Upload</button>
        </div>
    ),
}));

describe('AdminDashboard Component', () => {
    let mockSupabase;
    let mockSession;

    beforeEach(() => {
        mockSession = {
            user: {
                id: 'user-123',
                email: 'admin@test.com',
            },
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({
                            data: [
                                {
                                    id: 1,
                                    processo: '1234567-89.2024.8.26.0100',
                                    titulo_peca: 'Petição Inicial',
                                    slug: 'ABC123',
                                    views: 5,
                                    created_at: '2024-01-15T10:00:00Z',
                                    access_password: 'senha123',
                                },
                            ],
                            count: 1,
                            error: null,
                        }),
                    }),
                    or: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            range: vi.fn().mockResolvedValue({
                                data: [],
                                count: 0,
                                error: null,
                            }),
                        }),
                    }),
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'admin' },
                            error: null,
                        }),
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            }),
            auth: {
                signOut: vi.fn().mockResolvedValue({}),
                signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
            },
        };

        vi.clearAllMocks();

        // Mock do clipboard usando defineProperty
        const mockClipboard = {
            writeText: vi.fn().mockResolvedValue(undefined),
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
            configurable: true,
        });

        // Mock do window.location
        delete window.location;
        window.location = {
            origin: 'https://test.com',
            reload: vi.fn(),
        };
    });

    describe('Renderização Inicial', () => {
        it('deve renderizar o dashboard corretamente', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByTestId('logo')).toBeInTheDocument();
            });
        });

        it('deve renderizar os botões de navegação', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByText('Novo Processo')).toBeInTheDocument();
                expect(screen.getByText('Monitoramento')).toBeInTheDocument();
            });
        });

        it('deve mostrar aba Upload por padrão', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByTestId('upload-form')).toBeInTheDocument();
            });
        });

        it('deve renderizar o botão de logout', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByTitle('Sair')).toBeInTheDocument();
            });
        });
    });

    describe('Navegação por Abas', () => {
        it('deve trocar para aba Monitoramento', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const monitoramentoButton = screen.getByText('Monitoramento');
                fireEvent.click(monitoramentoButton);
            });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Buscar por nome do cliente/i)).toBeInTheDocument();
            });
        });

        it('deve trocar para aba Novo Processo', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            // Primeiro vai para Monitoramento
            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Buscar por nome do cliente/i)).toBeInTheDocument();
            });

            // Depois volta para Upload
            const uploadButton = screen.getByText('Novo Processo');
            fireEvent.click(uploadButton);

            await waitFor(() => {
                expect(screen.getByTestId('upload-form')).toBeInTheDocument();
            });
        });

        it('deve mostrar aba Equipe apenas para admins', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByText('Equipe')).toBeInTheDocument();
            });
        });
    });

    describe('Funcionalidade de Busca', () => {
        it('deve renderizar campo de busca na aba Monitoramento', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Buscar por nome do cliente/i)).toBeInTheDocument();
            });
        });

        it('deve atualizar o campo de busca', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText(/Buscar por nome do cliente/i);
                fireEvent.change(searchInput, { target: { value: 'Petição' } });
                expect(searchInput.value).toBe('Petição');
            });
        });
    });

    describe('Exibição de Processos', () => {
        it('deve mostrar mensagem quando não há processos', async () => {
            // Mock para retornar lista vazia
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({
                            data: [],
                            count: 0,
                            error: null,
                        }),
                    }),
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'admin' },
                            error: null,
                        }),
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                expect(screen.getByText('Nenhum processo encontrado')).toBeInTheDocument();
            });
        });

        it('deve mostrar botão Novo Upload quando não há processos', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({
                            data: [],
                            count: 0,
                            error: null,
                        }),
                    }),
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'admin' },
                            error: null,
                        }),
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                expect(screen.getByText('Novo Upload')).toBeInTheDocument();
            });
        });
    });

    describe('Funcionalidade de Logout', () => {
        it('deve chamar signOut ao clicar no botão de logout', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const logoutButton = screen.getByTitle('Sair');
                fireEvent.click(logoutButton);
            });

            await waitFor(() => {
                expect(mockSupabase.auth.signOut).toHaveBeenCalled();
            });
        });
    });

    describe('Gestão de Equipe', () => {
        it('deve renderizar formulário de adicionar membro na aba Equipe', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Gestão de Equipe')).toBeInTheDocument();
                expect(screen.getByText('Adicionar Membro')).toBeInTheDocument();
            });
        });

        it('deve renderizar campos de email e senha no formulário', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/dr.silva@almeidaadv.com.br/i)).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
            });
        });

        it('deve ter checkbox para nível de administrador', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Nível de Administrador')).toBeInTheDocument();
            });
        });

        it('deve ter botão Copiar Link de Cadastro', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Copiar Link de Cadastro')).toBeInTheDocument();
            });
        });

        it('deve copiar link de cadastro ao clicar no botão', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                const copyButton = screen.getByText('Copiar Link de Cadastro');
                fireEvent.click(copyButton);
            });

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://test.com/cadastro');
        });
    });

    describe('Notificações Toast', () => {
        it('deve mostrar notificação de sucesso ao copiar link', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                const copyButton = screen.getByText('Copiar Link de Cadastro');
                fireEvent.click(copyButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Link copiado!')).toBeInTheDocument();
            });
        });
    });

    describe('UploadForm Integration', () => {
        it('deve trocar para aba Monitoramento após upload bem sucedido', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByTestId('upload-form')).toBeInTheDocument();
            });

            const simularUploadButton = screen.getByText('Simular Upload');
            fireEvent.click(simularUploadButton);

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Buscar por nome do cliente/i)).toBeInTheDocument();
            });
        });
    });

    describe('Informações de Ajuda', () => {
        it('deve mostrar tooltip de busca inteligente', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            await waitFor(() => {
                expect(screen.getByText('Busca Inteligente')).toBeInTheDocument();
            });
        });
    });

    describe('Usuário Não Admin', () => {
        it('não deve mostrar aba Equipe para usuário comum', async () => {
            // Mock para retornar role 'user'
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({
                            data: [],
                            count: 0,
                            error: null,
                        }),
                    }),
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'user' },
                            error: null,
                        }),
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.queryByText('Equipe')).not.toBeInTheDocument();
            });
        });
    });

    describe('Estados de Loading', () => {
        it('deve mostrar loading durante carregamento de dados', async () => {
            // Mock que demora para responder
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        range: vi.fn().mockImplementation(() =>
                            new Promise(resolve => setTimeout(() => resolve({ data: [], count: 0, error: null }), 100))
                        ),
                    }),
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'admin' },
                            error: null,
                        }),
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            const monitoramentoButton = screen.getByText('Monitoramento');
            fireEvent.click(monitoramentoButton);

            // Durante o loading
            expect(screen.getByText('Carregando dados do servidor...')).toBeInTheDocument();
        });
    });

    describe('Acessibilidade', () => {
        it('deve ter botões com títulos descritivos', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                expect(screen.getByTitle('Sair')).toBeInTheDocument();
            });
        });

        it('deve ter campos de formulário com labels', async () => {
            render(<AdminDashboard supabase={mockSupabase} session={mockSession} />);

            await waitFor(() => {
                const equipeButton = screen.getByText('Equipe');
                fireEvent.click(equipeButton);
            });

            await waitFor(() => {
                expect(screen.getByText('E-mail Corporativo')).toBeInTheDocument();
                expect(screen.getByText('Senha Temporária')).toBeInTheDocument();
            });
        });
    });
});
