import { createClient } from "@supabase/supabase-js"
import {
  RegisteredEntity,
  StockItem,
  Quotation,
  QuotationItem,
  SalesOrder,
  SalesOrderItem,
  Invoice,
  InvoiceItem,
  Payment,
  Purchase,
  PurchaseItem,
  Expense,
  CashSale,
  CashSaleItem,
  StockMovement,
  AccountSummary,
  DatabaseResult,
  ApiResponse,
  PaginatedResponse,
  FilterState,
  PaginationInfo
} from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Create a mock supabase client if no real configuration is provided
export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to handle database responses
function handleDatabaseResponse<T>(data: any, error: any): DatabaseResult<T> {
  return {
    data: data || null,
    error: error?.message || null,
    count: data?.length || 0
  }
}

// Helper function to create API responses
function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message
  }
}

// Helper function to handle pagination
function createPaginatedResponse<T>(
  items: T[],
  page: number,
  perPage: number,
  totalCount: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalCount / perPage)
  
  return {
    items,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  }
}

// Register (Clients/Suppliers) Operations
export class RegisterService {
  static async getAll(filters: FilterState): Promise<ApiResponse<PaginatedResponse<RegisteredEntity>>> {
    try {
      let query = supabase
        .from('registered_entities')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply sorting
      if (filters.sort_by) {
        query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
      } else {
        query = query.order('date_added', { ascending: false })
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.per_page
      const to = from + filters.per_page - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      const paginatedResponse = createPaginatedResponse(
        data || [],
        filters.page,
        filters.per_page,
        count || 0
      )

      return createApiResponse(true, paginatedResponse)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async getById(id: number): Promise<ApiResponse<RegisteredEntity>> {
    try {
      const { data, error } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async create(entity: Omit<RegisteredEntity, 'id' | 'date_added'>): Promise<ApiResponse<RegisteredEntity>> {
    try {
      const { data, error } = await supabase
        .from('registered_entities')
        .insert([{
          ...entity,
          date_added: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Entity created successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async update(id: number, entity: Partial<RegisteredEntity>): Promise<ApiResponse<RegisteredEntity>> {
    try {
      const { data, error } = await supabase
        .from('registered_entities')
        .update(entity)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Entity updated successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async delete(id: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('registered_entities')
        .delete()
        .eq('id', id)

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, true, undefined, 'Entity deleted successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async searchByName(name: string, type?: 'client' | 'supplier'): Promise<ApiResponse<RegisteredEntity[]>> {
    try {
      let query = supabase
        .from('registered_entities')
        .select('*')
        .ilike('name', `%${name}%`)
        .eq('status', 'active')

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query.limit(10)

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data || [])
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }
}

// Stock Operations
export class StockService {
  static async getAll(filters: FilterState): Promise<ApiResponse<PaginatedResponse<StockItem>>> {
    try {
      let query = supabase
        .from('stock_items')
        .select(`
          *,
          supplier:registered_entities(*)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // Apply sorting
      if (filters.sort_by) {
        query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
      } else {
        query = query.order('name', { ascending: true })
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.per_page
      const to = from + filters.per_page - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      const paginatedResponse = createPaginatedResponse(
        data || [],
        filters.page,
        filters.per_page,
        count || 0
      )

      return createApiResponse(true, paginatedResponse)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async getById(id: number): Promise<ApiResponse<StockItem>> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          *,
          supplier:registered_entities(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async create(item: Omit<StockItem, 'id' | 'date_added' | 'last_updated' | 'status'>): Promise<ApiResponse<StockItem>> {
    try {
      const status = item.quantity > item.reorder_level ? 'in_stock' : 
                    item.quantity > 0 ? 'low_stock' : 'out_of_stock'

      const { data, error } = await supabase
        .from('stock_items')
        .insert([{
          ...item,
          date_added: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          status
        }])
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Stock item created successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async update(id: number, item: Partial<StockItem>): Promise<ApiResponse<StockItem>> {
    try {
      const updateData = {
        ...item,
        last_updated: new Date().toISOString()
      }

      // Update status based on quantity if quantity is being updated
      if (item.quantity !== undefined && item.reorder_level !== undefined) {
        updateData.status = item.quantity > item.reorder_level ? 'in_stock' : 
                           item.quantity > 0 ? 'low_stock' : 'out_of_stock'
      }

      const { data, error } = await supabase
        .from('stock_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Stock item updated successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async updateQuantity(id: number, newQuantity: number, type: 'in' | 'out' | 'adjustment', reference?: { type: string, id: number }): Promise<ApiResponse<StockItem>> {
    try {
      // First, get current stock item
      const { data: currentItem, error: getError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('id', id)
        .single()

      if (getError) {
        return createApiResponse(false, undefined, getError.message)
      }

      // Update stock quantity
      const updatedItem = await this.update(id, { quantity: newQuantity })

      if (!updatedItem.success) {
        return updatedItem
      }

      // Record stock movement
      const movementQuantity = type === 'in' ? newQuantity - currentItem.quantity : currentItem.quantity - newQuantity
      
      await supabase
        .from('stock_movements')
        .insert([{
          stock_item_id: id,
          type,
          quantity: Math.abs(movementQuantity),
          reference_type: reference?.type || 'adjustment',
          reference_id: reference?.id,
          date_created: new Date().toISOString()
        }])

      return updatedItem
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async searchByName(name: string): Promise<ApiResponse<StockItem[]>> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .ilike('name', `%${name}%`)
        .limit(10)

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data || [])
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async getLowStockItems(): Promise<ApiResponse<StockItem[]>> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .or('status.eq.low_stock,status.eq.out_of_stock')
        .order('quantity', { ascending: true })

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data || [])
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }
}

// Quotation Operations
export class QuotationService {
  static async getAll(filters: FilterState): Promise<ApiResponse<PaginatedResponse<Quotation>>> {
    try {
      let query = supabase
        .from('quotations')
        .select(`
          *,
          client:registered_entities(*),
          quotation_items(
            *,
            stock_item:stock_items(*)
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`quotation_number.ilike.%${filters.search}%,client.name.ilike.%${filters.search}%`)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.date_from) {
        query = query.gte('date_created', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('date_created', filters.date_to)
      }

      // Apply sorting
      if (filters.sort_by) {
        query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
      } else {
        query = query.order('date_created', { ascending: false })
      }

      // Apply pagination
      const from = (filters.page - 1) * filters.per_page
      const to = from + filters.per_page - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      const paginatedResponse = createPaginatedResponse(
        data || [],
        filters.page,
        filters.per_page,
        count || 0
      )

      return createApiResponse(true, paginatedResponse)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async getById(id: number): Promise<ApiResponse<Quotation>> {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          client:registered_entities(*),
          quotation_items(
            *,
            stock_item:stock_items(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data)
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async create(quotation: Omit<Quotation, 'id' | 'date_created' | 'last_modified' | 'quotation_number'>): Promise<ApiResponse<Quotation>> {
    try {
      // Generate quotation number
      const { data: lastQuotation } = await supabase
        .from('quotations')
        .select('quotation_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (lastQuotation && lastQuotation.length > 0) {
        const lastNumber = parseInt(lastQuotation[0].quotation_number.replace('QT', ''))
        nextNumber = lastNumber + 1
      }

      const quotationNumber = `QT${nextNumber.toString().padStart(4, '0')}`

      const { data, error } = await supabase
        .from('quotations')
        .insert([{
          ...quotation,
          quotation_number: quotationNumber,
          date_created: new Date().toISOString(),
          last_modified: new Date().toISOString(),
          status: 'draft'
        }])
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Quotation created successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async update(id: number, quotation: Partial<Quotation>): Promise<ApiResponse<Quotation>> {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .update({
          ...quotation,
          last_modified: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return createApiResponse(false, undefined, error.message)
      }

      return createApiResponse(true, data, undefined, 'Quotation updated successfully')
    } catch (error) {
      return createApiResponse(false, undefined, (error as Error).message)
    }
  }

  static async updateStatus(id: number, status: string): Promise<ApiResponse<Quotation>> {
    return this.update(id, { status: status as any })
  }

  static async generateNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('quotations')
        .select('quotation_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].quotation_number.replace('QT', ''))
        nextNumber = lastNumber + 1
      }

      return `QT${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `QT${Date.now().toString().slice(-4)}`
    }
  }
}

// Number Generation Utilities
export class NumberGenerationService {
  static async generateInvoiceNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].invoice_number.replace('INV', ''))
        nextNumber = lastNumber + 1
      }

      return `INV${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `INV${Date.now().toString().slice(-4)}`
    }
  }

  static async generateSalesOrderNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('sales_orders')
        .select('order_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].order_number.replace('SO', ''))
        nextNumber = lastNumber + 1
      }

      return `SO${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `SO${Date.now().toString().slice(-4)}`
    }
  }

  static async generatePaymentNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('payments')
        .select('payment_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].payment_number.replace('PAY', ''))
        nextNumber = lastNumber + 1
      }

      return `PAY${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `PAY${Date.now().toString().slice(-4)}`
    }
  }

  static async generatePurchaseNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('purchases')
        .select('purchase_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].purchase_number.replace('PO', ''))
        nextNumber = lastNumber + 1
      }

      return `PO${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `PO${Date.now().toString().slice(-4)}`
    }
  }

  static async generateExpenseNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('expenses')
        .select('expense_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].expense_number.replace('EXP', ''))
        nextNumber = lastNumber + 1
      }

      return `EXP${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `EXP${Date.now().toString().slice(-4)}`
    }
  }

  static async generateCashSaleNumber(): Promise<string> {
    try {
      const { data } = await supabase
        .from('cash_sales')
        .select('sale_number')
        .order('id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].sale_number.replace('CS', ''))
        nextNumber = lastNumber + 1
      }

      return `CS${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      return `CS${Date.now().toString().slice(-4)}`
    }
  }
}

// Export all services
export {
  handleDatabaseResponse,
  createApiResponse,
  createPaginatedResponse
}
