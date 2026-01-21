-- Confirmação manual de e-mail para o usuário admin
-- Substitua 'admin@admin.com' pelo e-mail que deseja confirmar se for diferente
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@admin.com';
