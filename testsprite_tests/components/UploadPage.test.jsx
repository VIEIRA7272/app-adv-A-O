// Usando globals do vitest.config.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadPage } from '../../src/components/UploadPage';

// Mock do Logo
vi.mock('../../src/components/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock do OptimizedBackground
vi.mock('../../src/components/OptimizedBackground', () => ({
    OptimizedBackground: ({ children }) => <div data-testid="optimized-background">{children}</div>,
}));

// Mock do PdfVisualEditor
vi.mock('../../src/components/PdfVisualEditor', () => ({
    PdfVisualEditor: ({ onSave, onCancel }) => (
        <div data-testid="pdf-visual-editor">
            <button onClick={() => onSave({ x: 100, y: 100 })}>Salvar</button>
            <button onClick={onCancel}>Cancelar</button>
        </div>
    ),
}));

// Mock do QRCode
vi.mock('qrcode', () => ({
    default: {
        toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
    },
}));

// Mock do pdf-lib
vi.mock('pdf-lib', () => ({
    PDFDocument: {
        load: vi.fn().mockResolvedValue({
            embedFont: vi.fn().mockResolvedValue({}),
            embedPng: vi.fn().mockResolvedValue({}),
            getPages: vi.fn().mockReturnValue([{
                drawImage: vi.fn(),
                drawText: vi.fn(),
                drawLine: vi.fn(),
                node: {
                    Annots: vi.fn().mockReturnValue(null),
                    set: vi.fn(),
                },
            }]),
            context: {
                register: vi.fn().mockReturnValue({}),
                obj: vi.fn().mockReturnValue({}),
            },
            save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        }),
        PDFName: { of: vi.fn() },
    },
    rgb: vi.fn().mockReturnValue({}),
    StandardFonts: { Helvetica: 'Helvetica' },
}));

// Mock da config
vi.mock('../../src/lib/config', () => ({
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
}));

describe('UploadPage Component', () => {
    let mockSupabase;
    let mockSession;
    let mockOnSuccess;

    beforeEach(() => {
        mockOnSuccess = vi.fn();
        mockSession = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
            },
        };

        mockSupabase = {
            storage: {
                from: vi.fn().mockReturnValue({
                    upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
                    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.pdf' } }),
                    listBuckets: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                listBuckets: vi.fn().mockResolvedValue({ data: [], error: null }),
            },
            from: vi.fn().mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null }),
            }),
            auth: {
                signOut: vi.fn().mockResolvedValue({}),
            },
        };

        vi.clearAllMocks();

        // Mock window.location
        delete window.location;
        window.location = {
            origin: 'https://test.com',
            href: '',
        };

        // Mock alert
        window.alert = vi.fn();
    });

    describe('Renderização Inicial', () => {
        it('deve renderizar a página corretamente', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByTestId('logo')).toBeInTheDocument();
            expect(screen.getByText('Enviar Documento')).toBeInTheDocument();
        });

        it('deve mostrar email do usuário no header', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });

        it('deve renderizar o OptimizedBackground', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByTestId('optimized-background')).toBeInTheDocument();
        });

        it('deve renderizar seção de branding', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText(/Excelência e/i)).toBeInTheDocument();
            expect(screen.getByText(/Inovação/i)).toBeInTheDocument();
        });

        it('deve renderizar seção de recursos premium', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Recursos Premium')).toBeInTheDocument();
            expect(screen.getByText('Explicação em Vídeo')).toBeInTheDocument();
            expect(screen.getByText('PDF Integrado')).toBeInTheDocument();
            expect(screen.getByText('Upload Rápido')).toBeInTheDocument();
        });

        it('deve renderizar seção de ambiente seguro', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Ambiente Seguro')).toBeInTheDocument();
            expect(screen.getByText('Criptografia de Ponta a Ponta')).toBeInTheDocument();
        });

        it('deve renderizar footer com versão', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText(/v3.3 FINAL/i)).toBeInTheDocument();
        });
    });

    describe('Campos do Formulário', () => {
        it('deve renderizar campo de número do processo', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Número do Processo')).toBeInTheDocument();
        });

        it('deve renderizar campo de título do documento', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Título do Documento (Opcional)')).toBeInTheDocument();
        });

        it('deve renderizar campo de senha', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText(/Proteger com Senha/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Defina uma senha se desejar')).toBeInTheDocument();
        });

        it('deve renderizar área de upload de PDF', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Upload do PDF')).toBeInTheDocument();
            expect(screen.getByText('Arraste aqui seu PDF')).toBeInTheDocument();
        });

        it('deve renderizar área de upload de vídeo', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Upload do Vídeo')).toBeInTheDocument();
            expect(screen.getByText('Arraste aqui seu Vídeo')).toBeInTheDocument();
        });

        it('deve renderizar botão de continuar', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Continuar para Posicionamento')).toBeInTheDocument();
        });
    });

    describe('Interações com Formulário', () => {
        it('deve atualizar campo de processo', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const processoInputs = screen.getAllByRole('textbox');
            const processoInput = processoInputs[0];

            fireEvent.change(processoInput, { target: { value: '1234567-89.2024.8.26.0100' } });

            expect(processoInput.value).toBe('1234567-89.2024.8.26.0100');
        });

        it('deve atualizar campo de título', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const inputs = screen.getAllByRole('textbox');
            const tituloInput = inputs[1];

            fireEvent.change(tituloInput, { target: { value: 'Petição Inicial' } });

            expect(tituloInput.value).toBe('Petição Inicial');
        });

        it('deve atualizar campo de senha', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const senhaInput = screen.getByPlaceholderText('Defina uma senha se desejar');

            fireEvent.change(senhaInput, { target: { value: 'senha123' } });

            expect(senhaInput.value).toBe('senha123');
        });
    });

    describe('Upload de Arquivos', () => {
        it('deve mostrar nome do arquivo PDF quando selecionado', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const pdfInput = document.getElementById('pdf-upload');
            const mockFile = new File(['test'], 'documento.pdf', { type: 'application/pdf' });

            fireEvent.change(pdfInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                expect(screen.getByText('documento.pdf')).toBeInTheDocument();
            });
        });

        it('deve mostrar nome do arquivo de vídeo quando selecionado', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const videoInput = document.getElementById('video-upload');
            const mockFile = new File(['test'], 'video.mp4', { type: 'video/mp4' });

            fireEvent.change(videoInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                expect(screen.getByText('video.mp4')).toBeInTheDocument();
            });
        });

        it('deve mostrar botão Remover após selecionar PDF', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const pdfInput = document.getElementById('pdf-upload');
            const mockFile = new File(['test'], 'documento.pdf', { type: 'application/pdf' });

            fireEvent.change(pdfInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                const removeButtons = screen.getAllByText('Remover');
                expect(removeButtons.length).toBeGreaterThan(0);
            });
        });

        it('deve remover PDF ao clicar em Remover', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const pdfInput = document.getElementById('pdf-upload');
            const mockFile = new File(['test'], 'documento.pdf', { type: 'application/pdf' });

            fireEvent.change(pdfInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                expect(screen.getByText('documento.pdf')).toBeInTheDocument();
            });

            const removeButtons = screen.getAllByText('Remover');
            fireEvent.click(removeButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('documento.pdf')).not.toBeInTheDocument();
            });
        });
    });

    describe('Validação', () => {
        it('deve mostrar alerta quando campos obrigatórios estão vazios', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const submitButton = screen.getByText('Continuar para Posicionamento');
            fireEvent.click(submitButton);

            expect(window.alert).toHaveBeenCalledWith('Preencha todos os campos.');
        });

        it('deve mostrar aviso para vídeo grande', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const videoInput = document.getElementById('video-upload');

            // Criar arquivo grande (60MB)
            const largeVideoSize = 60 * 1024 * 1024;
            const mockLargeVideo = new File([new ArrayBuffer(largeVideoSize)], 'large-video.mp4', { type: 'video/mp4' });
            Object.defineProperty(mockLargeVideo, 'size', { value: largeVideoSize });

            fireEvent.change(videoInput, { target: { files: [mockLargeVideo] } });

            await waitFor(() => {
                expect(screen.getByText(/Arquivo grande/i)).toBeInTheDocument();
            });
        });
    });

    describe('Navegação', () => {
        it('deve ter link para Meus Processos', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText(/Ir para Meus Processos/i)).toBeInTheDocument();
        });

        it('deve ter botão de logout', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Sair')).toBeInTheDocument();
        });

        it('deve redirecionar para admin ao clicar em Meus Processos', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const adminLink = screen.getByText(/Ir para Meus Processos/i);
            fireEvent.click(adminLink);

            expect(window.location.href).toBe('/admin');
        });

        it('deve fazer logout e redirecionar ao clicar em Sair', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const logoutButton = screen.getByText('Sair');
            fireEvent.click(logoutButton);

            await waitFor(() => {
                expect(mockSupabase.auth.signOut).toHaveBeenCalled();
                expect(window.location.href).toBe('/login');
            });
        });
    });

    describe('Instruções Como Funciona', () => {
        it('deve mostrar instruções de como funciona', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('COMO FUNCIONA?')).toBeInTheDocument();
            expect(screen.getByText('Faça upload do PDF e Vídeo')).toBeInTheDocument();
            expect(screen.getByText('Posicione o QR Code no visualizador')).toBeInTheDocument();
            expect(screen.getByText('Baixe o PDF final com link integrado')).toBeInTheDocument();
            expect(screen.getByText('Anexe ao processo judicial')).toBeInTheDocument();
        });
    });

    describe('Botão Teste Final', () => {
        it('deve renderizar botão Teste Final', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Teste Final')).toBeInTheDocument();
        });

        it('deve mostrar mensagem de sucesso ao testar conexão', async () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const testButton = screen.getByText('Teste Final');
            fireEvent.click(testButton);

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith('CONEXÃO PERFEITA! ✅\nO sistema está 100% operacional.');
            });
        });
    });

    describe('Drag and Drop', () => {
        it('deve aceitar drag enter para PDF', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const pdfDropzone = screen.getByText('Arraste aqui seu PDF').closest('div').parentElement;

            fireEvent.dragEnter(pdfDropzone, {
                dataTransfer: { files: [] }
            });

            expect(pdfDropzone).toBeInTheDocument();
        });

        it('deve aceitar drag enter para vídeo', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            const videoDropzone = screen.getByText('Arraste aqui seu Vídeo').closest('div').parentElement;

            fireEvent.dragEnter(videoDropzone, {
                dataTransfer: { files: [] }
            });

            expect(videoDropzone).toBeInTheDocument();
        });
    });

    describe('Acessibilidade', () => {
        it('deve ter labels para todos os campos', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Número do Processo')).toBeInTheDocument();
            expect(screen.getByText('Título do Documento (Opcional)')).toBeInTheDocument();
            expect(screen.getByText(/Proteger com Senha/i)).toBeInTheDocument();
            expect(screen.getByText('Upload do PDF')).toBeInTheDocument();
            expect(screen.getByText('Upload do Vídeo')).toBeInTheDocument();
        });

        it('deve ter botões com texto descritivo', () => {
            render(<UploadPage supabase={mockSupabase} session={mockSession} onSuccess={mockOnSuccess} />);

            expect(screen.getByText('Continuar para Posicionamento')).toBeInTheDocument();
            expect(screen.getAllByText('Selecionar').length).toBe(2); // PDF e Vídeo
        });
    });
});
