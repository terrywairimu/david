
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually read .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
} catch (e) {
    console.log('Could not read .env.local');
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getLatestClient() {
    const { data, error } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('type', 'client')
        .order('date_added', { ascending: false }) // OR 'created_at' if date_added isn't populated for all
        .limit(1);

    if (error) {
        console.error('Error fetching client:', error);
        return;
    }

    if (data && data.length > 0) {
        const client = data[0];
        console.log(`Latest Client found:`);
        console.log(`Name: ${client.name}`);
        console.log(`Date Added: ${client.date_added}`);
        console.log(`Email: ${client.email}`);
        console.log(`Phone: ${client.phone}`);
    } else {
        console.log('No clients found.');
    }
}

getLatestClient();
