-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA - ADVOCACIA 4.0
-- ==============================================================================
-- Copie e cole todo este conteúdo no "SQL Editor" do Supabase e clique em "Run".
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE PROCESSOS
CREATE TABLE IF NOT EXISTS public.videos_pecas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo_peca TEXT NOT NULL,
    video_url TEXT NOT NULL,
    access_password TEXT,
    views BIGINT DEFAULT 0,
    slug TEXT NOT NULL UNIQUE
);

-- 2. HABILITAR SEGURANÇA (RLS)
ALTER TABLE public.videos_pecas ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS DE ACESSO (PERMISSÕES)
-- Nota: Estas políticas permitem que QUALQUER usuário logado (da equipe) veja e edite TUDO.

-- Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Ver tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Inserir tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Editar tudo" ON public.videos_pecas;
DROP POLICY IF EXISTS "Deletar tudo" ON public.videos_pecas;

-- Política de LEITURA (SELECT): Todos da equipe podem ver todos os processos
CREATE POLICY "Ver tudo"
ON public.videos_pecas
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERÇÃO (INSERT): Todos da equipe podem criar novos processos
CREATE POLICY "Inserir tudo"
ON public.videos_pecas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de ATUALIZAÇÃO (UPDATE): Todos da equipe podem editar (ex: views, titulo)
CREATE POLICY "Editar tudo"
ON public.videos_pecas
FOR UPDATE
TO authenticated
USING (true);

-- Política de EXCLUSÃO (DELETE): Todos da equipe podem deletar processos
CREATE POLICY "Deletar tudo"
ON public.videos_pecas
FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- ADD TRACKING TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.view_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_slug TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip TEXT,
    location TEXT,
    device TEXT
);

-- RLS
ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (anon) to INSERT a log (tracking)
CREATE POLICY "Allow public insert logs"
ON public.view_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow ONLY TEAM (authenticated) to VIEW logs
CREATE POLICY "Allow team select logs"
ON public.view_logs
FOR SELECT
TO authenticated
USING (true);


-- 4. CONFIGURAÇÃO DE ARMAZENAMENTO (STORAGE)
-- Tenta criar os buckets se não existirem (Requer permissão de superusuário ou executar no dashboard)

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-final-v3', 'videos-final-v3', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pecas-final-v3', 'pecas-final-v3', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (Para permitir upload)
-- Ajuste para permitir que usuários autenticados façam upload e leitura

-- Videos Bucket
CREATE POLICY "Videos Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos-final-v3' );

CREATE POLICY "Videos Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'videos-final-v3' );

-- PDFs Bucket
CREATE POLICY "PDFs Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pecas-final-v3' );

CREATE POLICY "PDFs Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'pecas-final-v3' );



-- ==============================================================================
-- 5. TABELA DE PERFIS E TRIGGERS (CRÍTICO)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas de Acesso (RLS) para Profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
