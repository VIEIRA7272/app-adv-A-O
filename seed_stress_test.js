
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kwzejxqfkmagbrbrymgd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3emVqeHFma21hZ2JyYnJ5bWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDIyNTUsImV4cCI6MjA3ODYxODI1NX0.y-C7LYR_f7rSIL4L5FLR5rwgNh5C9cbLa022PclQwvw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const nomes = [
    "Miguel Silva", "Arthur Oliveira", "Gael Santos", "Heitor Rodrigues", "Helena Ferreira",
    "Alice Pereira", "Laura Alves", "Maria Eduarda Lima", "Valentina Costa", "Sophia Martins",
    "Bernardo Gomes", "Gabriel Araújo", "Enzo Ribeiro", "Rafael Carvalho", "Matheus Lopes",
    "Isabella Barbosa", "Manuela Ramos", "Júlia Castro", "Beatriz Dias", "Luiza Duarte"
];

const acoes = [
    "Ação de Divórcio Consensual", "Inventário - Espólio", "Reclamação Trabalhista",
    "Ação de Cobrança Indevida", "Mandado de Segurança", "Ação de Usucapião",
    "Revisão de Contrato Bancário", "Indenização por Danos Morais", "Guarda Compartilhada", "Alimentos Gravídicos"
];

async function seed() {
    console.log("🧹 Limpando dados de teste anteriores...");

    // Delete previous test data
    const { error: deleteError } = await supabase
        .from('videos_pecas')
        .delete()
        .ilike('slug', 'teste-carga-%');

    if (deleteError) console.error("Erro ao limpar:", deleteError);

    console.log("🚀 Gerando 50 Processos com nomes de pessoas fictícias...");

    const records = [];
    for (let i = 0; i < 50; i++) {
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const sobrenome = nomes[Math.floor(Math.random() * nomes.length)].split(' ')[1];
        const nomeCompleto = `${nome} ${sobrenome}`;
        const acao = acoes[Math.floor(Math.random() * acoes.length)];
        const num = Math.floor(Math.random() * 1000000).toString().padStart(7, '0');

        records.push({
            processo: `${num}-${Math.floor(Math.random() * 99)}.2025.8.26.0000`,
            titulo_peca: `${acao} - ${nomeCompleto}`,
            slug: `teste-carga-${Date.now()}-${i}`,
            video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            pdf_final_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            access_password: i % 3 === 0 ? '1234' : null, // 33% with password
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random date in past
        });
    }

    const { error } = await supabase.from('videos_pecas').insert(records);

    if (error) {
        console.error("❌ Erro ao inserir dados:", error);
    } else {
        console.log("✅ Sucesso! 50 registros realistas inseridos.");
        console.log("👉 Atualize o painel.");
    }
}

seed();
