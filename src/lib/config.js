import { CLIENTE_SUPABASE_URL, CLIENTE_SUPABASE_KEY } from './configuracao_cliente';

// Se as chaves do cliente estiverem preenchidas (não forem o padrão), usa elas.
// Caso contrário, usa as variáveis de ambiente (para desenvolvimento local).
const isClientConfigured = CLIENTE_SUPABASE_URL.includes("supabase.co") && !CLIENTE_SUPABASE_URL.includes("SEU_PROJETO");

export const SUPABASE_URL = isClientConfigured ? CLIENTE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = isClientConfigured ? CLIENTE_SUPABASE_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY;
