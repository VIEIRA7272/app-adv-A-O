-- ==============================================================================
-- MIGRATION: Adicionar colunas faltantes à tabela videos_pecas
-- ==============================================================================
-- RODE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- ==============================================================================

-- Adiciona a coluna pdf_final_url (URL do PDF)
ALTER TABLE public.videos_pecas 
ADD COLUMN IF NOT EXISTS pdf_final_url TEXT;

-- Adiciona a coluna processo (número do processo)
ALTER TABLE public.videos_pecas 
ADD COLUMN IF NOT EXISTS processo TEXT;

-- Permite que usuários anônimos vejam os processos (para a landing page funcionar)
DROP POLICY IF EXISTS "Ver tudo publico" ON public.videos_pecas;
CREATE POLICY "Ver tudo publico"
ON public.videos_pecas
FOR SELECT
TO anon
USING (true);
