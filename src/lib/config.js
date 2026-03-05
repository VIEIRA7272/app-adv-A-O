import { CLIENTE_SUPABASE_URL, CLIENTE_SUPABASE_KEY } from './configuracao_cliente';

// Prioridade: Variáveis de ambiente (.env) > Configuração do cliente (configuracao_cliente.js)
// Em produção (Vercel), configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
// no painel do Vercel em Settings > Environment Variables.

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isClientConfigured = CLIENTE_SUPABASE_URL.includes("supabase.co") && !CLIENTE_SUPABASE_URL.includes("SEU_PROJETO") && !CLIENTE_SUPABASE_URL.includes("COLOQUE");

// .env tem prioridade — se existir, usa. Senão, tenta o configuracao_cliente.js
export const SUPABASE_URL = envUrl || (isClientConfigured ? CLIENTE_SUPABASE_URL : '');
export const SUPABASE_ANON_KEY = envKey || (isClientConfigured ? CLIENTE_SUPABASE_KEY : '');
