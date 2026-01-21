# Gestão Inteligente de Peças Jurídicas

Este é um aplicativo React para gestão de peças jurídicas com upload de vídeos e geração de QR Codes.

## Pré-requisitos

- Node.js instalado (recomendado v18 ou superior)

## Instalação

1. Instale as dependências:
   ```bash
   npm install
   ```

## Executando Localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173` (ou outra porta indicada no terminal).

## Deploy no GitHub Pages

1. No `package.json`, adicione a propriedade `homepage`:
   ```json
   "homepage": "https://seu-usuario.github.io/nome-do-repo",
   ```

2. Instale o `gh-pages`:
   ```bash
   npm install gh-pages --save-dev
   ```

3. Adicione os scripts de deploy no `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist",
     ...
   }
   ```

4. Execute o deploy:
   ```bash
   npm run deploy
   ```

## Tecnologias

- React
- Vite
- Tailwind CSS
- Supabase
- Lucide React
