-- Promover usuário para ADMIN
-- Substitua 'SEU_EMAIL_AQUI' pelo e-mail que você cadastrou
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@admin.com'; -- <--- COLOQUE SEU EMAIL AQUI ENTRE AS ASPAS
