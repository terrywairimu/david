const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('Running migration to add payment fields to purchases table...')
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./scripts/add-payment-fields-to-purchases.sql', 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error('Error executing statement:', error)
          // Continue with other statements
        } else {
          console.log('✓ Statement executed successfully')
        }
      }
    }
    
    console.log('Migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration()
