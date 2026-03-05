// Usando globals do vitest.config.js
import { cn } from '../../src/lib/utils';

describe('cn (className utility)', () => {
    describe('Funcionalidade Básica', () => {
        it('deve retornar string vazia quando não receber argumentos', () => {
            expect(cn()).toBe('');
        });

        it('deve retornar a classe quando receber uma única classe', () => {
            expect(cn('text-red-500')).toBe('text-red-500');
        });

        it('deve concatenar múltiplas classes', () => {
            const result = cn('text-red-500', 'bg-blue-500');
            expect(result).toContain('text-red-500');
            expect(result).toContain('bg-blue-500');
        });

        it('deve mesclar classes Tailwind conflitantes corretamente', () => {
            // twMerge deve manter apenas a última classe conflitante
            const result = cn('text-red-500', 'text-blue-500');
            expect(result).toBe('text-blue-500');
        });
    });

    describe('Tratamento de Condicionais (clsx)', () => {
        it('deve ignorar valores falsy', () => {
            expect(cn('text-red-500', false, null, undefined, '')).toBe('text-red-500');
        });

        it('deve aceitar objetos condicionais', () => {
            const result = cn('base', { 'text-red-500': true, 'text-blue-500': false });
            expect(result).toContain('base');
            expect(result).toContain('text-red-500');
            expect(result).not.toContain('text-blue-500');
        });

        it('deve aceitar arrays de classes', () => {
            const result = cn(['text-red-500', 'bg-white']);
            expect(result).toContain('text-red-500');
            expect(result).toContain('bg-white');
        });

        it('deve lidar com arrays aninhados', () => {
            const result = cn(['text-red-500', ['bg-white', 'p-4']]);
            expect(result).toContain('text-red-500');
            expect(result).toContain('bg-white');
            expect(result).toContain('p-4');
        });
    });

    describe('Merge de Classes Tailwind (twMerge)', () => {
        it('deve resolver conflitos de padding', () => {
            const result = cn('p-4', 'p-8');
            expect(result).toBe('p-8');
        });

        it('deve resolver conflitos de margin', () => {
            const result = cn('m-2', 'm-4');
            expect(result).toBe('m-4');
        });

        it('deve manter classes não conflitantes', () => {
            const result = cn('p-4', 'm-4', 'text-red-500');
            expect(result).toContain('p-4');
            expect(result).toContain('m-4');
            expect(result).toContain('text-red-500');
        });

        it('deve resolver conflitos de width', () => {
            const result = cn('w-full', 'w-1/2');
            expect(result).toBe('w-1/2');
        });

        it('deve resolver conflitos de background', () => {
            const result = cn('bg-red-500', 'bg-blue-500');
            expect(result).toBe('bg-blue-500');
        });

        it('deve resolver conflitos de flex', () => {
            const result = cn('flex-row', 'flex-col');
            expect(result).toBe('flex-col');
        });

        it('deve manter variantes diferentes', () => {
            const result = cn('hover:bg-red-500', 'bg-blue-500');
            expect(result).toContain('hover:bg-red-500');
            expect(result).toContain('bg-blue-500');
        });

        it('deve resolver conflitos dentro de variantes', () => {
            const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
            expect(result).toBe('hover:bg-blue-500');
        });
    });

    describe('Casos de Uso Reais', () => {
        it('deve funcionar com classes de botão típicas', () => {
            const result = cn(
                'px-4 py-2 rounded-md font-medium',
                'bg-blue-500 text-white',
                'hover:bg-blue-600'
            );
            expect(result).toContain('px-4');
            expect(result).toContain('py-2');
            expect(result).toContain('rounded-md');
            expect(result).toContain('bg-blue-500');
            expect(result).toContain('hover:bg-blue-600');
        });

        it('deve funcionar com override de variante', () => {
            const baseClasses = 'px-4 py-2 bg-gray-100';
            const variantClasses = 'bg-blue-500 text-white';
            const result = cn(baseClasses, variantClasses);

            expect(result).toContain('px-4');
            expect(result).toContain('py-2');
            expect(result).toContain('bg-blue-500');
            expect(result).not.toContain('bg-gray-100');
        });

        it('deve funcionar com classes condicionais de estado', () => {
            const isActive = true;
            const isDisabled = false;

            const result = cn(
                'base-class',
                isActive && 'active-class',
                isDisabled && 'disabled-class'
            );

            expect(result).toContain('base-class');
            expect(result).toContain('active-class');
            expect(result).not.toContain('disabled-class');
        });

        it('deve funcionar com objeto de variantes', () => {
            const variant = 'primary';
            const size = 'large';

            const variants = {
                primary: 'bg-blue-500 text-white',
                secondary: 'bg-gray-200 text-gray-800',
            };

            const sizes = {
                small: 'px-2 py-1 text-sm',
                large: 'px-6 py-3 text-lg',
            };

            const result = cn(variants[variant], sizes[size]);

            expect(result).toContain('bg-blue-500');
            expect(result).toContain('text-white');
            expect(result).toContain('px-6');
            expect(result).toContain('text-lg');
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com números (ignorar)', () => {
            // clsx converte números para string, mas geralmente não queremos isso
            const result = cn('text-red-500', 0);
            expect(result).toBe('text-red-500');
        });

        it('deve lidar com espaços extras', () => {
            const result = cn('  text-red-500  ', '  bg-blue-500  ');
            // Deve normalizar os espaços
            expect(result).not.toMatch(/^\s/);
            expect(result).not.toMatch(/\s$/);
        });

        it('deve lidar com classes duplicadas', () => {
            const result = cn('text-red-500', 'text-red-500');
            // Não deve duplicar
            expect(result).toBe('text-red-500');
        });
    });
});
