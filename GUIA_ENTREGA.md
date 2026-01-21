# Guia de Entrega e Configuração - Advocacia 4.0

Este guia explica como configurar o aplicativo para um novo cliente do zero.

## 1. Criar Projeto no Supabase
1.  Acesse [database.new](https://database.new) e crie um novo projeto.
2.  Defina uma senha forte para o banco de dados (guarde-a se necessário, mas não precisaremos dela no app).
3.  Aguarde o projeto iniciar (leva uns 2 minutos).

## 2. Configurar o Banco de Dados (Automático)
1.  No menu lateral esquerdo do Supabase, clique em **SQL Editor**.
2.  Clique em **+ New query**.
3.  Abra o arquivo `database/setup_database.sql` que está neste projeto.
4.  Copie todo o conteúdo dele e cole no editor do Supabase.
5.  Clique no botão **RUN** (canto inferior direito).
    *   *Isso vai criar as tabelas (videos e logs), configurar a segurança e liberar o acesso para a equipe.*

## 3. Configurar Autenticação (Email)
1.  Vá em **Authentication** -> **Providers**.
2.  Clique em **Email**.
3.  **LIGUE** a opção "Enable Email provider".
4.  **DESLIGUE** a opção "Confirm email" (Isso é importante para não travar o cadastro).
5.  Salve.

## 4. Conectar o Aplicativo
1.  Vá em **Project Settings** (ícone de engrenagem) -> **API**.
2.  Copie a **Project URL**.
3.  Abra o arquivo `src/lib/configuracao_cliente.js` no código.
4.  Cole a URL no campo `CLIENTE_SUPABASE_URL`.
5.  Copie a **anon public** Key (Chave pública).
6.  Cole a chave no campo `CLIENTE_SUPABASE_KEY`.

## 5. Criar o Primeiro Usuário (Admin)
1.  Rode o aplicativo (`npm run dev`).
2.  Vá para a tela de Login (`/login`).
3.  Como ainda não tem usuário, você precisará criar o primeiro via Painel do Supabase ou usar o botão de "Criar Conta" se tiver implementado, mas o ideal é:
    *   Vá em **Authentication** -> **Users** no Supabase.
    *   Clique em **Add User** -> **Create New User**.
    *   Coloque o email (ex: `admin@cliente.com`) e senha.
    *   Clique em "Auto Confirm User".
    *   Clique em **Create User**.

## 6. Pronto!
O sistema está pronto para uso. O cliente pode logar, fazer upload de vídeos e cadastrar outros advogados da equipe pelo painel administrativo.
