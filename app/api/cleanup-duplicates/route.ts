import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Create a temporary table to identify which records to keep (the first one for each client+amount combination)
    const { error: createTempError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TEMP TABLE cash_sales_to_keep AS
        SELECT 
            MIN(id) as id_to_keep,
            client_id,
            grand_total
        FROM cash_sales 
        GROUP BY client_id, grand_total;
      `
    })

    if (createTempError) {
      console.error('Error creating temp table:', createTempError)
      return NextResponse.json({ error: 'Failed to create temp table' }, { status: 500 })
    }

    // Count records before deletion
    const { data: beforeCount, error: countError } = await supabase
      .from('cash_sales')
      .select('id', { count: 'exact' })

    if (countError) {
      console.error('Error counting records:', countError)
      return NextResponse.json({ error: 'Failed to count records' }, { status: 500 })
    }

    // Delete duplicate cash sales, keeping only the first one for each client+amount combination
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        DELETE FROM cash_sales 
        WHERE id NOT IN (
            SELECT id_to_keep FROM cash_sales_to_keep
        );
      `
    })

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError)
      return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 })
    }

    // Count records after deletion
    const { data: afterCount, error: afterCountError } = await supabase
      .from('cash_sales')
      .select('id', { count: 'exact' })

    if (afterCountError) {
      console.error('Error counting records after deletion:', afterCountError)
      return NextResponse.json({ error: 'Failed to count records after deletion' }, { status: 500 })
    }

    const deletedCount = (beforeCount?.length || 0) - (afterCount?.length || 0)

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      beforeCount: beforeCount?.length || 0,
      afterCount: afterCount?.length || 0
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
