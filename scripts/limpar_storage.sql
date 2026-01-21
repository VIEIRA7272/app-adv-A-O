-- =========================================================
-- SCRIPT DE LIMPEZA DE STORAGE SUPABASE
-- =========================================================

-- 1. VERIFICAR O QUE ESTÁ OCUPANDO ESPAÇO
-- Rode este comando primeiro para ver os "comedores de espaço"
SELECT bucket_id, count(*) as quantidade_arquivos, sum((metadata->>'size')::int)/1024/1024 as tamanho_mb 
FROM storage.objects 
GROUP BY bucket_id;

-- =========================================================
-- OPÇÃO 1: LIMPEZA SEGURA (Recomendado)
-- Apaga apenas a pasta de vídeos pesados, mantendo logos e documentos.
-- =========================================================

DELETE FROM storage.objects WHERE bucket_id = 'videos-final-v3';


-- =========================================================
-- OPÇÃO 2: LIMPEZA NUCLEAR (Cuidado!)
-- Apaga TUDO de todos os buckets. Só use se realmente não precisar de nada.
-- Remove o "--" da frente da linha abaixo para rodar:
-- =========================================================

-- DELETE FROM storage.objects;


-- =========================================================
-- DICA:
-- Depois de rodar, o Supabase pode levar até 60 minutos para atualizar o aviso de bloqueio.
-- =========================================================
