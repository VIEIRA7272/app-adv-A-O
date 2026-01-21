
import { createClient } from '@supabase/supabase-js';
import { CLIENTE_SUPABASE_URL, CLIENTE_SUPABASE_KEY } from '../src/lib/configuracao_cliente.js';

const supabase = createClient(CLIENTE_SUPABASE_URL, CLIENTE_SUPABASE_KEY);

const realisticdata = [
    { old: 'deita@gmail.com', new: 'dr.almeida@almeidaadv.com.br' },
    { old: 'feratest@gmail.com', new: 'contato@ferreiraeassoc.com' },
    { old: 'dogao@exemple.com', new: 'juridico@construtorabuild.com' },
    { old: 'agustinho@exemple.com', new: 'processual@santossilva.adv.br' },
    { old: 'cliente@teste.com', new: 'diretoria@holdingroup.com' },
    { old: 'jaotest@gmail.com', new: 'assistente.joao@almeidaadv.com.br' },
    { old: 'admin@adv.com', new: 'dr.roberto@adv.com.br' }
];

async function fixData() {
    console.log("Starting data polish (Authenticating as Admin)...");

    // 1. Authenticate as Admin to hopefully bypass RLS (if policies allow 'admin' role)
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'admin123456'
    });

    if (authError || !session) {
        console.error("FATAL: Could not login as admin. RLS might block updates.", authError);
        // We will try anyway, but it's risky
    } else {
        console.log("Logged in as Admin successfully.");
    }

    // 2. Fetch profiles
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    for (const p of profiles) {
        let match = realisticdata.find(r => p.email.includes(r.old.split('@')[0]));

        if (match) {
            console.log(`Attempting Update: ${p.email} -> ${match.new}`);

            // Check if update works
            const { data, error: updateError, count } = await supabase
                .from('profiles')
                .update({ email: match.new })
                .eq('id', p.id)
                .select(); // Select to verify return

            if (updateError) {
                console.error(`FAILED to update ${p.email}:`, updateError.message);
            } else if (data.length === 0) {
                console.warn(`WARNING: Update ran but no rows returned for ${p.email}. Likely RLS blocked it.`);
            } else {
                console.log(`SUCCESS: Updated ${p.email} to ${data[0].email}`);
            }
        }
    }

    console.log("Data polish complete.");
}

fixData();
