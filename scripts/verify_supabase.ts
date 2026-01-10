
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually read .env.local since we are running a standalone script
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.log('Could not read .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Connecting to:', supabaseUrl);
    try {
        // Try to selecting from a common table
        // Using 'head: true' and 'count: exact' is a lightweight way to check access
        const { data, count, error } = await supabase.from('registered_entities').select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', error.message, error.code);
            if (error.code === 'PGRST116') {
                console.log('Table might be missing or empty, but connection likely established.');
            } else {
                // If 404 or others, it might mean the project is paused or URL is wrong
                console.log('Connection Failed.');
            }
        } else {
            console.log('Connection verified successfully! Count:', count);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
