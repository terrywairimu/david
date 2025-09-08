// Script to identify and clean up duplicate sales orders
// This will find duplicates and keep only the first one, deleting the rest

import { supabase } from '../lib/supabase-client'

async function cleanupDuplicateSalesOrders() {
  console.log('🔍 Starting to identify and clean up duplicate sales orders...')
  
  try {
    // Get all sales orders grouped by client and amount to find duplicates
    const { data: salesOrders, error } = await supabase
      .from('sales_orders')
      .select(`
        id,
        order_number,
        client_id,
        original_quotation_number,
        grand_total,
        date_created,
        status,
        client:registered_entities(name)
      `)
      .order('date_created', { ascending: true })

    if (error) throw error

    if (!salesOrders || salesOrders.length === 0) {
      console.log('No sales orders found')
      return
    }

    // Group sales orders by client and amount to find duplicates
    const groupedOrders = new Map<string, any[]>()
    
    for (const order of salesOrders) {
      const key = `${order.client_id}-${order.grand_total}-${order.original_quotation_number}`
      if (!groupedOrders.has(key)) {
        groupedOrders.set(key, [])
      }
      groupedOrders.get(key)!.push(order)
    }

    // Find groups with duplicates
    const duplicateGroups = Array.from(groupedOrders.entries())
      .filter(([key, orders]) => orders.length > 1)

    console.log(`📊 Found ${duplicateGroups.length} groups with duplicate sales orders`)

    let totalDeleted = 0
    let totalKept = 0

    for (const [key, orders] of duplicateGroups) {
      console.log(`\n🔄 Processing duplicate group: ${orders[0].client?.name} - KES ${orders[0].grand_total}`)
      console.log(`   Original Quotation: ${orders[0].original_quotation_number}`)
      console.log(`   Found ${orders.length} duplicate orders:`)
      
      // Sort by date created (keep the first one)
      orders.sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime())
      
      const keepOrder = orders[0]
      const deleteOrders = orders.slice(1)
      
      console.log(`   ✅ Keeping: ${keepOrder.order_number} (${keepOrder.date_created})`)
      
      for (const deleteOrder of deleteOrders) {
        console.log(`   ❌ Deleting: ${deleteOrder.order_number} (${deleteOrder.date_created})`)
        
        try {
          // Delete sales order items first
          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .delete()
            .eq('sales_order_id', deleteOrder.id)
          
          if (itemsError) {
            console.error(`   ⚠️ Error deleting items for ${deleteOrder.order_number}:`, itemsError)
          }
          
          // Delete the sales order
          const { error: deleteError } = await supabase
            .from('sales_orders')
            .delete()
            .eq('id', deleteOrder.id)
          
          if (deleteError) {
            console.error(`   ❌ Error deleting ${deleteOrder.order_number}:`, deleteError)
          } else {
            console.log(`   ✅ Successfully deleted ${deleteOrder.order_number}`)
            totalDeleted++
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${deleteOrder.order_number}:`, error)
        }
      }
      
      totalKept++
    }

    console.log(`\n🎉 Cleanup completed!`)
    console.log(`   📊 Groups processed: ${duplicateGroups.length}`)
    console.log(`   ✅ Sales orders kept: ${totalKept}`)
    console.log(`   ❌ Sales orders deleted: ${totalDeleted}`)

    // Also check for any sales orders that might have been created from the same quotation
    console.log(`\n🔍 Checking for sales orders from same quotations...`)
    
    const { data: quotationGroups, error: quotationError } = await supabase
      .from('sales_orders')
      .select('original_quotation_number')
      .not('original_quotation_number', 'is', null)

    if (quotationError) throw quotationError

    const quotationCounts = new Map<string, number>()
    for (const order of quotationGroups || []) {
      const count = quotationCounts.get(order.original_quotation_number) || 0
      quotationCounts.set(order.original_quotation_number, count + 1)
    }

    const duplicateQuotations = Array.from(quotationCounts.entries())
      .filter(([quotation, count]) => count > 1)

    if (duplicateQuotations.length > 0) {
      console.log(`⚠️ Found ${duplicateQuotations.length} quotations with multiple sales orders:`)
      for (const [quotation, count] of duplicateQuotations) {
        console.log(`   ${quotation}: ${count} sales orders`)
      }
    } else {
      console.log(`✅ No quotations with multiple sales orders found`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

// Run the script
cleanupDuplicateSalesOrders()
