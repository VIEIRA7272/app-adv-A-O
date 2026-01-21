-- ======================================================
-- SCRIPT COMPLETO: CONFIRMAR EMAIL + PROMOVER A ADMIN
-- ======================================================
-- Substitua o email abaixo pelo seu email real cadastrado
-- ======================================================

-- 1. Confirmar o email (para poder fazer login)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'ronirodesimabranceira@gmail.com';

-- 2. Promover para ADMIN (para ver a aba Equipe)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'ronirodesimabranceira@gmail.com';
