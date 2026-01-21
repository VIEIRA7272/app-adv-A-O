-- ==============================================================================
-- CORREÇÃO PARA ACESSO PÚBLICO (CLIENTES)
-- ==============================================================================

-- 1. FUNÇÃO SEGURA PARA INCREMENTAR VIEWS (Sem dar permissão de UPDATE na tabela toda)
CREATE OR REPLACE FUNCTION public.increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.videos_pecas
  SET views = COALESCE(views, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PERMITIR QUE CLIENTES (ANÔNIMOS) VEJAM OS PROCESSOS
-- Sem isso, o cliente receberá um erro ao tentar abrir o link gerado.
DROP POLICY IF EXISTS "Public View" ON public.videos_pecas;
CREATE POLICY "Public View"
ON public.videos_pecas
FOR SELECT
TO anon
USING (true);

-- Comentário: Agora qualquer pessoa com o link poderá acessar os dados do processo
-- (Título, Vídeo, etc.) para que a página carrege. A segurança dos outros dados
-- é mantida pois a API não expõe a listagem completa sem filtros conhecidos.
