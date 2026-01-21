-- ======================================================
-- PROMOVER USUÁRIO PARA ADMIN (após criar pelo Dashboard)
-- ======================================================
-- Rode isso DEPOIS de criar o usuário pelo painel Supabase
-- ======================================================

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@admin.com';
