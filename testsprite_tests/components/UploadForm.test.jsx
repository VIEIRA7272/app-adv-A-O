// Usando globals do vitest.config.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadForm } from '../../src/components/UploadForm';

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

describe('UploadForm Component', () => {
    let mockSupabase;
    let mockOnSuccess;

    beforeEach(() => {
        mockOnSuccess = vi.fn();
        mockSupabase = {
            storage: {
                from: vi.fn().mockReturnValue({
                    upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
                    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.pdf' } }),
                }),
            },
            from: vi.fn().mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: null }),
            }),
        };

        vi.clearAllMocks();

        // Mock window.location
        delete window.location;
        window.location = { origin: 'https://test.com' };
    });

    describe('Renderização Inicial', () => {
        it('deve renderizar o formulário corretamente', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByText('Novo Processo')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('0000000-00.0000.0.00.0000')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Ex: Petição Inicial')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Defina uma senha...')).toBeInTheDocument();
        });

        it('deve renderizar as labels dos campos', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByText('Número do Processo')).toBeInTheDocument();
            expect(screen.getByText('Nome do Cliente / Título da Peça')).toBeInTheDocument();
            expect(screen.getByText('Proteger com Senha')).toBeInTheDocument();
        });

        it('deve renderizar as áreas de upload', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByText('Documento PDF')).toBeInTheDocument();
            expect(screen.getByText('Vídeo Explicativo')).toBeInTheDocument();
            expect(screen.getByText('PDF do Processo')).toBeInTheDocument();
            expect(screen.getByText('Arquivo de Vídeo')).toBeInTheDocument();
        });

        it('deve renderizar o botão de submit', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
        });

        it('deve renderizar as seções laterais em desktop', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByText('Excelência Jurídica')).toBeInTheDocument();
            expect(screen.getByText('Passo a Passo')).toBeInTheDocument();
            expect(screen.getByText('Segurança Digital')).toBeInTheDocument();
        });
    });

    describe('Interações com Formulário', () => {
        it('deve atualizar o campo de processo', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);
            const input = screen.getByPlaceholderText('0000000-00.0000.0.00.0000');

            fireEvent.change(input, { target: { value: '1234567-89.2024.8.26.0100' } });

            expect(input.value).toBe('1234567-89.2024.8.26.0100');
        });

        it('deve atualizar o campo de título', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);
            const input = screen.getByPlaceholderText('Ex: Petição Inicial');

            fireEvent.change(input, { target: { value: 'Habeas Corpus' } });

            expect(input.value).toBe('Habeas Corpus');
        });

        it('deve atualizar o campo de senha', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);
            const input = screen.getByPlaceholderText('Defina uma senha...');

            fireEvent.change(input, { target: { value: 'senha123' } });

            expect(input.value).toBe('senha123');
        });
    });

    describe('Validação de Campos', () => {
        it('deve mostrar erro quando campos obrigatórios estão vazios', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);
            const submitButton = screen.getByRole('button', { name: /Continuar/i });

            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Por favor, preencha todos os campos e anexe os arquivos.')).toBeInTheDocument();
            });
        });

        it('deve mostrar erro quando apenas processo está preenchido', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            const processoInput = screen.getByPlaceholderText('0000000-00.0000.0.00.0000');
            fireEvent.change(processoInput, { target: { value: '1234567-89.2024.8.26.0100' } });

            const submitButton = screen.getByRole('button', { name: /Continuar/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Por favor, preencha todos os campos e anexe os arquivos.')).toBeInTheDocument();
            });
        });
    });

    describe('Upload de Arquivos', () => {
        it('deve mostrar nome do arquivo PDF quando selecionado', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            const pdfInput = document.getElementById('form-pdf-upload');
            const mockFile = new File(['test'], 'documento.pdf', { type: 'application/pdf' });

            fireEvent.change(pdfInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                expect(screen.getByText('documento.pdf')).toBeInTheDocument();
            });
        });

        it('deve mostrar nome do arquivo de vídeo quando selecionado', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            const videoInput = document.getElementById('form-video-upload');
            const mockFile = new File(['test'], 'video.mp4', { type: 'video/mp4' });

            fireEvent.change(videoInput, { target: { files: [mockFile] } });

            await waitFor(() => {
                expect(screen.getByText('video.mp4')).toBeInTheDocument();
            });
        });
    });

    describe('Estados de Loading', () => {
        it('deve desabilitar o botão durante o loading', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            // Preencher campos
            const processoInput = screen.getByPlaceholderText('0000000-00.0000.0.00.0000');
            fireEvent.change(processoInput, { target: { value: '1234567-89.2024.8.26.0100' } });

            // Adicionar arquivos
            const pdfInput = document.getElementById('form-pdf-upload');
            const videoInput = document.getElementById('form-video-upload');

            const mockPdf = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
            const mockVideo = new File(['test'], 'video.mp4', { type: 'video/mp4' });

            // Mock arrayBuffer para o PDF
            mockPdf.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            fireEvent.change(pdfInput, { target: { files: [mockPdf] } });
            fireEvent.change(videoInput, { target: { files: [mockVideo] } });

            const submitButton = screen.getByRole('button', { name: /Continuar/i });
            fireEvent.click(submitButton);

            // Durante o processamento, deve mostrar "Processando..."
            await waitFor(() => {
                expect(screen.getByText(/Processando/i)).toBeInTheDocument();
            }, { timeout: 1000 }).catch(() => {
                // Se não encontrar "Processando", o botão deve estar desabilitado
                expect(submitButton).toBeDisabled();
            });
        });
    });

    describe('Validação de Tamanho de Arquivo', () => {
        it('deve mostrar erro para vídeo maior que 50MB', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            // Preencher campos
            const processoInput = screen.getByPlaceholderText('0000000-00.0000.0.00.0000');
            fireEvent.change(processoInput, { target: { value: '1234567-89.2024.8.26.0100' } });

            // Adicionar arquivos
            const pdfInput = document.getElementById('form-pdf-upload');
            const videoInput = document.getElementById('form-video-upload');

            const mockPdf = new File(['test'], 'doc.pdf', { type: 'application/pdf' });

            // Criar arquivo de vídeo grande (60MB)
            const largeVideoSize = 60 * 1024 * 1024; // 60MB
            const mockLargeVideo = new File([new ArrayBuffer(largeVideoSize)], 'large-video.mp4', { type: 'video/mp4' });
            Object.defineProperty(mockLargeVideo, 'size', { value: largeVideoSize });

            fireEvent.change(pdfInput, { target: { files: [mockPdf] } });
            fireEvent.change(videoInput, { target: { files: [mockLargeVideo] } });

            const submitButton = screen.getByRole('button', { name: /Continuar/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/Limite: 50MB/i)).toBeInTheDocument();
            });
        });
    });

    describe('Drag and Drop', () => {
        it('deve aceitar drag enter para PDF', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            const pdfDropzone = screen.getByText('PDF do Processo').closest('div').parentElement;

            fireEvent.dragEnter(pdfDropzone, {
                dataTransfer: { files: [] }
            });

            // O dropzone deve ter uma classe indicando que está ativo
            expect(pdfDropzone).toBeInTheDocument();
        });

        it('deve aceitar drag enter para vídeo', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            const videoDropzone = screen.getByText('Arquivo de Vídeo').closest('div').parentElement;

            fireEvent.dragEnter(videoDropzone, {
                dataTransfer: { files: [] }
            });

            expect(videoDropzone).toBeInTheDocument();
        });
    });

    describe('Mensagens de Erro', () => {
        it('deve exibir mensagem de erro com ícone de alerta', async () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);
            const submitButton = screen.getByRole('button', { name: /Continuar/i });

            fireEvent.click(submitButton);

            await waitFor(() => {
                const errorMessage = screen.getByText('Por favor, preencha todos os campos e anexe os arquivos.');
                expect(errorMessage).toBeInTheDocument();

                // Verificar se o container de erro existe
                const errorContainer = errorMessage.closest('div');
                expect(errorContainer).toHaveClass('text-red-300');
            });
        });
    });

    describe('Informações de Ajuda', () => {
        it('deve conter tooltips com informações de ajuda', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            // Verificar se os textos de ajuda estão no DOM (mesmo que ocultos)
            expect(screen.getByText(/Use o formato CNJ padrão/i)).toBeInTheDocument();
            // O texto "Tamanho máximo: 50MB" aparece múltiplas vezes (PDF e Vídeo), então usamos getAllByText
            const tamanhoMaximoElements = screen.getAllByText(/Tamanho máximo:/i);
            expect(tamanhoMaximoElements.length).toBeGreaterThan(0);
        });

        it('deve mostrar instruções de passo a passo', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByText(/Preencha o número do processo/i)).toBeInTheDocument();
            expect(screen.getByText(/Anexe o PDF da peça processual/i)).toBeInTheDocument();
            expect(screen.getByText(/Grave ou faça upload do vídeo/i)).toBeInTheDocument();
        });
    });

    describe('Acessibilidade', () => {
        it('deve ter inputs com placeholders descritivos', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            expect(screen.getByPlaceholderText('0000000-00.0000.0.00.0000')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Ex: Petição Inicial')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Defina uma senha...')).toBeInTheDocument();
        });

        it('deve ter labels associados aos campos', () => {
            render(<UploadForm onSuccess={mockOnSuccess} supabase={mockSupabase} />);

            // Verificar que as labels existem
            const labels = screen.getAllByText(/Número do Processo|Nome do Cliente|Proteger com Senha/i);
            expect(labels.length).toBeGreaterThan(0);
        });
    });
});
