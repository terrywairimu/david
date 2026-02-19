"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, Download, CreditCard, TrendingUp, DollarSign, Calendar, Wallet, Building, CreditCard as CreditIcon, FileText, RefreshCw, Smartphone, Coins } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { useGlobalProgress } from "@/components/GlobalProgressManager"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPaymentsReport } from "@/lib/workflow-utils"
import { getCurrentNairobiTime } from "@/lib/timezone"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { formatNumber, parseFormattedNumber } from "@/lib/format-number"

interface AccountSummaryViewProps {
  clients: RegisteredEntity[]
  payments: Payment[]
  loading: boolean
  onRefresh: () => void
}

interface AccountBalance {
  account_type: string
  current_balance: number
  total_in: number
  total_out: number
}

interface AccountTransaction {
  id: number
  transaction_number: string
  account_type: string
  transaction_type: string
  amount: number
  description: string
  reference_type: string
  reference_id: number
  transaction_date: string
  balance_after: number
  money_in: number
  money_out: number
  reference_number: string
  reference_description: string
  client_id?: number
  client_name?: string
}

const AccountSummaryView = ({ clients, payments, loading, onRefresh }: AccountSummaryViewProps) => {
  const { canPerformAction } = useAuth()
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("") // Default to empty string (all dates)
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([])
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [loadingBalances, setLoadingBalances] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Add account filter state
  const [activeAccountFilter, setActiveAccountFilter] = useState<string>("")
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  
  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferFromAccount, setTransferFromAccount] = useState("")
  const [transferToAccount, setTransferToAccount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  
  // Add refs to prevent duplicate operations
  const syncInProgress = useRef(false)
  const lastSyncTime = useRef<number>(0)
  const transactionNumberCounter = useRef<number>(0)
  const loadAccountDataDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Improved transaction number generation with better concurrency handling
  const generateUniqueTransactionNumber = async (): Promise<string> => {
    try {
      // Use a combination of timestamp and counter to ensure uniqueness
      const timestamp = Date.now()
      const counter = ++transactionNumberCounter.current
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      
      // Create a unique number that's very unlikely to conflict
      const uniqueNumber = `${timestamp}${counter}${randomSuffix}`
      
      // Format as TXN + 6 digits (using last 6 digits of unique number)
      const formattedNumber = `TXN${uniqueNumber.slice(-6)}`
      
      // Double-check that this number doesn't exist (very unlikely but safe)
      const { data: existingCheck } = await supabase
        .from('account_transactions')
        .select('id')
        .eq('transaction_number', formattedNumber)
        .maybeSingle()

      if (existingCheck) {
        // If by some miracle it exists, add more randomness
        const extraRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `TXN${uniqueNumber.slice(-4)}${extraRandom}`
      }

      return formattedNumber
    } catch (error) {
      console.error('Error generating transaction number:', error)
      // Ultimate fallback with timestamp and random
      return `TXN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    }
  }

  // Utility function to check if transaction exists with better error handling
  const checkTransactionExists = async (referenceType: string, referenceId: number): Promise<boolean> => {
    try {
      const { data: existingTransaction, error: checkError } = await supabase
        .from('account_transactions')
        .select('id')
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .maybeSingle()

      if (checkError) {
        console.error(`Error checking existing ${referenceType} transaction:`, checkError)
        return false
      }

      return !!existingTransaction
    } catch (error) {
      console.error(`Error checking ${referenceType} transaction existence:`, error)
      return false
    }
  }

  // Improved transaction creation with better retry logic
  const createTransactionWithRetry = async (transactionData: any, maxRetries: number = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Generate a new transaction number for each attempt
        const newTransactionNumber = await generateUniqueTransactionNumber()
        const transactionToInsert = {
          ...transactionData,
          transaction_number: newTransactionNumber
        }
        
        const { error: insertError } = await supabase
          .from('account_transactions')
          .insert(transactionToInsert)

        if (insertError) {
          console.error(`Attempt ${attempt} failed:`, insertError)
          
          // If it's a unique constraint violation, continue to next attempt
          if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate') || insertError.code === '23505') {
            console.log(`Transaction number conflict on attempt ${attempt}, trying with new number...`)
            continue
          }
          
          return false
        }
        
        return true
      } catch (error) {
        console.error(`Attempt ${attempt} failed with exception:`, error)
        if (attempt === maxRetries) return false
      }
    }
    
    return false
  }

  // Improved duplicate cleanup with better logic
  const cleanupDuplicateTransactions = async (): Promise<void> => {
    try {
      console.log('Starting duplicate transaction cleanup...')
      
      // Find and remove duplicate transactions based on reference_type and reference_id
      const { data: allTransactions, error: fetchError } = await supabase
        .from('account_transactions')
        .select('id, reference_type, reference_id, transaction_number, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching transactions for cleanup:', fetchError)
        return
      }

      const seen = new Map<string, number>()
      const toDelete: number[] = []

      for (const transaction of allTransactions || []) {
        const key = `${transaction.reference_type}-${transaction.reference_id}`
        if (seen.has(key)) {
          // Keep the first one (oldest), delete the rest
          toDelete.push(transaction.id)
        } else {
          seen.set(key, transaction.id)
        }
      }

      if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate transactions to remove`)
        const { error: deleteError } = await supabase
          .from('account_transactions')
          .delete()
          .in('id', toDelete)

        if (deleteError) {
          console.error('Error deleting duplicate transactions:', deleteError)
        } else {
          console.log(`Successfully removed ${toDelete.length} duplicate transactions`)
        }
      } else {
        console.log('No duplicate transactions found')
      }
    } catch (error) {
      console.error('Error during duplicate cleanup:', error)
    }
  }

  // Utility function to validate database schema
  const validateDatabaseSchema = async (): Promise<boolean> => {
    try {
      console.log('Validating database schema...')
      
      // Check if account_transactions table exists and has required columns
      const { data: tableInfo, error: tableError } = await supabase
        .from('account_transactions')
        .select('id, transaction_number, account_type, transaction_type, amount, reference_type, reference_id, transaction_date')
        .limit(1)

      if (tableError) {
        console.error('Error validating account_transactions table:', tableError)
        return false
      }

      console.log('Database schema validation passed')
      return true
    } catch (error) {
      console.error('Error during schema validation:', error)
      return false
    }
  }

  const debouncedLoadAccountData = () => {
    if (loadAccountDataDebounceRef.current) clearTimeout(loadAccountDataDebounceRef.current)
    loadAccountDataDebounceRef.current = setTimeout(() => {
      loadAccountDataDebounceRef.current = null
      loadAccountData()
    }, 500)
  }

  useEffect(() => {
    setupClientOptions()
    loadAccountData()

    const setupRealtimeSubscriptions = () => {
      const handler = () => debouncedLoadAccountData()
      const ch = supabase
        .channel('account-summary-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'account_transactions' }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, handler)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, handler)
        .subscribe()
      return () => {
        if (loadAccountDataDebounceRef.current) clearTimeout(loadAccountDataDebounceRef.current)
        supabase.removeChannel(ch)
      }
    }
    return setupRealtimeSubscriptions()
  }, [clients])

  const setupClientOptions = () => {
    const options = clients.map(client => ({
      value: client.id.toString(),
      label: client.name
    }))
    setClientOptions(options)
  }

  const loadAccountData = async () => {
    try {
      setLoadingBalances(true)
      
      // Check if sync is needed before running it
      const needsSync = await checkIfSyncNeeded()
      
      if (needsSync) {
        await syncAllTransactions()
      }
      
      // Single unified fetch for both balances and transactions
      await loadAccountDataUnified()
    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoadingBalances(false)
    }
  }

  // OPTIMIZED: Bulk check - single query per type to get existing IDs, find missing in memory
  const getMissingTransactionIds = async (): Promise<{
    paymentIds: number[]
    expenseIds: number[]
    purchaseIds: number[]
  }> => {
    try {
      const [paymentsRes, expensesRes, purchasesRes, paymentTxRes, expenseTxRes, purchaseTxRes] = await Promise.all([
        supabase.from('payments').select('id'),
        supabase.from('expenses').select('id'),
        supabase.from('purchases').select('id'),
        supabase.from('account_transactions').select('reference_id').eq('reference_type', 'payment'),
        supabase.from('account_transactions').select('reference_id').eq('reference_type', 'expense'),
        supabase.from('account_transactions').select('reference_id').eq('reference_type', 'purchase'),
      ])

      const paymentIds = new Set((paymentsRes.data || []).map((p: { id: number }) => p.id))
      const expenseIds = new Set((expensesRes.data || []).map((e: { id: number }) => e.id))
      const purchaseIds = new Set((purchasesRes.data || []).map((p: { id: number }) => p.id))
      const existingPaymentTx = new Set((paymentTxRes.data || []).map((t: { reference_id: number }) => t.reference_id))
      const existingExpenseTx = new Set((expenseTxRes.data || []).map((t: { reference_id: number }) => t.reference_id))
      const existingPurchaseTx = new Set((purchaseTxRes.data || []).map((t: { reference_id: number }) => t.reference_id))

      const missingPaymentIds = [...paymentIds].filter(id => !existingPaymentTx.has(id))
      const missingExpenseIds = [...expenseIds].filter(id => !existingExpenseTx.has(id))
      const missingPurchaseIds = [...purchaseIds].filter(id => !existingPurchaseTx.has(id))

      return { paymentIds: missingPaymentIds, expenseIds: missingExpenseIds, purchaseIds: missingPurchaseIds }
    } catch (error) {
      console.error('Error getting missing transaction IDs:', error)
      return { paymentIds: [], expenseIds: [], purchaseIds: [] }
    }
  }

  const checkIfSyncNeeded = async (): Promise<boolean> => {
    try {
      if (syncInProgress.current) return false
      const now = Date.now()
      if (now - lastSyncTime.current < 2 * 60 * 1000) return false

      const { paymentIds, expenseIds, purchaseIds } = await getMissingTransactionIds()
      const hasMissing = paymentIds.length > 0 || expenseIds.length > 0 || purchaseIds.length > 0
      if (hasMissing) {
        console.log('Sync needed - missing:', { payments: paymentIds.length, expenses: expenseIds.length, purchases: purchaseIds.length })
      }
      return hasMissing
    } catch (error) {
      console.error('Error checking if sync needed:', error)
      return false
    }
  }

  const handleManualSync = async () => {
    try {
      setIsSyncing(true)
      await syncAllTransactions()
      toast.success('Manual sync completed successfully')
    } catch (error) {
      console.error('Error during manual sync:', error)
      toast.error('Manual sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const mapPaymentToAccountType = (payment: any): string => {
    const creditedField = payment.account_credited || payment.account_paid_to
    if (creditedField) {
      const credited = String(creditedField)
      if (credited === 'Cash') return 'cash'
      if (credited === 'Cooperative Bank') return 'cooperative_bank'
      if (credited === 'Credit') return 'credit'
      if (credited === 'Cheque') return 'cheque'
      if (credited === 'M-Pesa' || credited === 'mpesa') return 'mpesa'
      if (credited === 'Petty Cash' || credited === 'petty_cash') return 'petty_cash'
    }
    if (payment.payment_method) {
      const method = String(payment.payment_method).toLowerCase().replace(/\s+/g, '_').replace('m-pesa', 'mpesa')
      if (['cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash'].includes(method)) return method
    }
    return 'cash'
  }

  const mapExpenseToAccountType = (expense: any): string => {
    const debitedField = expense.account_debited || expense.account_paid_from
    if (debitedField) {
      const debited = String(debitedField)
      if (debited === 'Cash') return 'cash'
      if (debited === 'Cooperative Bank') return 'cooperative_bank'
      if (debited === 'Credit') return 'credit'
      if (debited === 'Cheque') return 'cheque'
      if (debited === 'M-Pesa' || debited === 'mpesa') return 'mpesa'
      if (debited === 'Petty Cash' || debited === 'petty_cash') return 'petty_cash'
    }
    return 'cash'
  }

  const mapPurchaseToAccountType = (purchase: any): string => {
    if (purchase.payment_method) {
      const method = String(purchase.payment_method).toLowerCase().replace(/\s+/g, '_').replace('m-pesa', 'mpesa')
      if (['cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash'].includes(method)) return method
    }
    return 'cash'
  }

  const formatExpenseDescription = (items: any[], expenseNumber: string): string => {
    if (!items || items.length === 0) return expenseNumber
    if (items.length === 1) {
      const item = items[0]
      return item.quantity === 1 ? `${item.description} @ ${item.rate}` : `${item.quantity} ${item.description} @ ${item.rate}`
    }
    return `${items.length} items: ${items.map((i: any) => i.quantity === 1 ? `${i.description} @ ${i.rate}` : `${i.quantity} ${i.description} @ ${i.rate}`).join(", ")}`
  }

  const formatPurchaseDescription = (items: any[], orderNumber: string): string => {
    if (!items || items.length === 0) return orderNumber
    const desc = (item: any) => {
      const si = item.stock_items
      const d = (si?.description && si.description.trim() !== '') ? si.description : (si?.name && si.name.trim() !== '') ? si.name : 'N/A'
      return `${d} (${item.quantity} ${si?.unit || 'N/A'})`
    }
    if (items.length === 1) return desc(items[0])
    return `${items.length} items: ${items.map(desc).join(", ")}`
  }

  const syncAllTransactions = async () => {
    if (syncInProgress.current) return
    try {
      syncInProgress.current = true
      setIsSyncing(true)
      console.log('Starting optimized transaction sync...')

      const schemaValid = await validateDatabaseSchema()
      if (!schemaValid) return

      const { paymentIds: missingPaymentIds, expenseIds: missingExpenseIds, purchaseIds: missingPurchaseIds } = await getMissingTransactionIds()
      const totalMissing = missingPaymentIds.length + missingExpenseIds.length + missingPurchaseIds.length
      if (totalMissing === 0) {
        console.log('No missing transactions to sync')
        lastSyncTime.current = Date.now()
        await loadAccountDataUnified()
        return
      }

      await cleanupDuplicateTransactions()

      const BATCH_SIZE = 50

      // Create transactions for missing payments
      if (missingPaymentIds.length > 0) {
        const { data: payments } = await supabase.from('payments').select('*').in('id', missingPaymentIds)
        const toInsert: any[] = []
        for (const payment of payments || []) {
          const accountType = mapPaymentToAccountType(payment)
          const txDate = payment.payment_date || payment.date_paid || payment.date_created
          toInsert.push({
            account_type: accountType,
            transaction_type: 'in',
            amount: payment.amount,
            description: payment.description || payment.payment_number,
            reference_type: 'payment',
            reference_id: payment.id,
            transaction_date: txDate,
            transaction_number: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            balance_after: 0,
          })
        }
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE)
          for (let j = 0; j < batch.length; j++) {
            batch[j] = { ...batch[j], transaction_number: await generateUniqueTransactionNumber() }
          }
          const { error } = await supabase.from('account_transactions').insert(batch)
          if (error) {
            console.error('Batch insert payments failed, falling back to single inserts:', error)
            for (const t of batch) {
              await createTransactionWithRetry({
                account_type: t.account_type,
                transaction_type: t.transaction_type,
                amount: t.amount,
                description: t.description,
                reference_type: 'payment',
                reference_id: t.reference_id,
                transaction_date: t.transaction_date,
                balance_after: 0,
              })
            }
          }
        }
        console.log(`Created ${toInsert.length} payment transactions`)
      }

      // Create transactions for missing expenses
      if (missingExpenseIds.length > 0) {
        const { data: expenses } = await supabase.from('expenses').select('*').in('id', missingExpenseIds)
        for (const expense of expenses || []) {
          const { data: items } = await supabase.from('expense_items').select('description, quantity, rate').eq('expense_id', expense.id)
          const desc = formatExpenseDescription(items || [], expense.expense_number)
          const accountType = mapExpenseToAccountType(expense)
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: expense.amount,
            description: desc,
            reference_type: 'expense',
            reference_id: expense.id,
            transaction_date: expense.date_created,
            balance_after: 0,
          })
          if (!success) console.error('Failed to create expense transaction:', expense.id)
        }
        console.log(`Created expenses for ${expenses?.length || 0} records`)
      }

      // Create transactions for missing purchases
      if (missingPurchaseIds.length > 0) {
        const { data: purchases } = await supabase.from('purchases').select('*').in('id', missingPurchaseIds)
        for (const purchase of purchases || []) {
          const { data: items } = await supabase.from('purchase_items').select(`
            stock_item_id, quantity, stock_items(name, description, unit)
          `).eq('purchase_id', purchase.id).order('id', { ascending: false })
          const desc = formatPurchaseDescription(items || [], purchase.purchase_order_number)
          const accountType = mapPurchaseToAccountType(purchase)
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: purchase.total_amount,
            description: desc,
            reference_type: 'purchase',
            reference_id: purchase.id,
            transaction_date: purchase.purchase_date,
            balance_after: 0,
          })
          if (!success) console.error('Failed to create purchase transaction:', purchase.id)
        }
        console.log(`Created purchases for ${purchases?.length || 0} records`)
      }

      lastSyncTime.current = Date.now()
      await loadAccountDataUnified()
      console.log('Transaction sync completed')
    } catch (error) {
      console.error('Error during transaction sync:', error)
      toast.error('Sync failed')
    } finally {
      syncInProgress.current = false
      setIsSyncing(false)
    }
  }

  const loadAccountDataUnified = async () => {
    try {
      const { data: transactionsData, error } = await supabase
        .from('account_transactions_view')
        .select('*')
      if (error) {
        const msg = error.message?.toLowerCase() || ''
        if (msg.includes('does not exist') || msg.includes('relation')) {
          toast.error('Account summary tables not found. Run scripts/create-account-tables.sql in Supabase.')
        } else {
          toast.error('Failed to load account data')
        }
        return
      }
      const txList = transactionsData || []
      setTransactions(txList)
      const balanceMap = new Map<string, { total_in: number; total_out: number; current_balance: number }>()
      const allAccountTypes = ['cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash']
      allAccountTypes.forEach(t => balanceMap.set(t, { total_in: 0, total_out: 0, current_balance: 0 }))
      for (const t of txList) {
        const accountType = t.account_type || 'cash'
        const current = balanceMap.get(accountType) || { total_in: 0, total_out: 0, current_balance: 0 }
        current.total_in += t.money_in || 0
        current.total_out += t.money_out || 0
        current.current_balance += (t.money_in || 0) - (t.money_out || 0)
        balanceMap.set(accountType, current)
      }
      setAccountBalances(Array.from(balanceMap.entries()).map(([account_type, b]) => ({
        account_type,
        current_balance: b.current_balance,
        total_in: b.total_in,
        total_out: b.total_out
      })))
    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Failed to load account data')
    }
  }

    const getFilteredTransactions = () => {
    let filtered = transactions

    // Account filter - filter by active account type
    if (activeAccountFilter) {
      filtered = filtered.filter(transaction => 
        transaction.account_type === activeAccountFilter
      )
    }

    // Search filter - search across ALL visible columns
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((transaction) => {
        const dateStr = transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString().toLowerCase() : ""
        const amountStr = transaction.amount != null ? String(transaction.amount).toLowerCase() : ""
        const moneyInStr = transaction.money_in != null ? String(transaction.money_in).toLowerCase() : ""
        const moneyOutStr = transaction.money_out != null ? String(transaction.money_out).toLowerCase() : ""
        const balanceStr = transaction.balance_after != null ? String(transaction.balance_after).toLowerCase() : ""
        return (
          transaction.transaction_number?.toLowerCase().includes(term) ||
          transaction.description?.toLowerCase().includes(term) ||
          transaction.reference_number?.toLowerCase().includes(term) ||
          transaction.reference_description?.toLowerCase().includes(term) ||
          transaction.account_type?.toLowerCase().includes(term) ||
          transaction.client_name?.toLowerCase().includes(term) ||
          (transaction.transaction_type?.toLowerCase().includes(term)) ||
          dateStr.includes(term) ||
          amountStr.includes(term) ||
          moneyInStr.includes(term) ||
          moneyOutStr.includes(term) ||
          balanceStr.includes(term)
        )
      })
    }

    // Client filter - filter by client_id
    if (clientFilter) {
      console.log('Applying client filter:', clientFilter)
      filtered = filtered.filter(transaction => {
        // Filter by client_id if available
        if (transaction.client_id) {
          const matches = transaction.client_id.toString() === clientFilter
          if (matches) {
            console.log('Transaction matches client filter:', transaction.reference_number, transaction.client_name)
          }
          return matches
        }
        return false // Hide transactions without client information
      })
      console.log('Transactions after client filter:', filtered.length)
    }

    // Date filter - only apply if dateFilter is not empty
    if (dateFilter && dateFilter !== "") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date)
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return transactionDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return transactionDay >= weekStart && transactionDay <= today
          case "month":
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
          case "year":
            return transactionDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return transactionDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return transactionDay >= startDay && transactionDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    // Since transactions are displayed newest first, we need to calculate balances in reverse order
    // to show the correct running balance for each transaction
    const transactionsForBalanceCalc = [...filtered].reverse() // Reverse to get chronological order for calculation
    
    let runningBalance = 0
    const balanceMap = new Map<number, number>()
    
    // Calculate balances chronologically (oldest to newest)
    transactionsForBalanceCalc.forEach(transaction => {
      if (transaction.transaction_type === 'in') {
        runningBalance += transaction.amount
      } else {
        runningBalance -= transaction.amount
      }
      balanceMap.set(transaction.id, runningBalance)
    })

    // Return transactions in display order (newest first) with calculated balances
    return filtered.map(transaction => ({
      ...transaction,
      balance_after: balanceMap.get(transaction.id) || 0
    }))
  }

  // Export function for SearchFilterRow
  const exportTransactions = async (format: 'pdf' | 'csv') => {
    const filteredData = getFilteredTransactions()
    startDownload(`account_transactions_${new Date().toISOString().split('T')[0]}`, format)
    try {
      if (format === 'csv') {
        await handleExport()
      } else {
        await exportPaymentsReport(filteredData, format, 'account-summary')
      }
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export account transactions')
      toast.error('Export failed')
    }
  }

  const handleExport = async (): Promise<void> => {
    try {
      const filteredData = getFilteredTransactions()
      
      // Create CSV content for account transactions
      const headers = ['Transaction #', 'Account', 'Date', 'Description', 'Amount', 'Status', 'Money In', 'Money Out', 'Balance']
      const csvContent = [
        headers.join(','),
        ...filteredData.map(transaction => [
          transaction.transaction_number,
          getAccountTitle(transaction.account_type),
          new Date(transaction.transaction_date).toLocaleDateString(),
          `"${transaction.description}"`,
          formatNumber(transaction.amount),
          transaction.transaction_type === 'in' ? 'In' : 'Out',
          formatNumber(transaction.money_in),
          formatNumber(transaction.money_out),
          formatNumber(transaction.balance_after)
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account_transactions_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Transactions exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    }
  }

  // Handle transfer between accounts
  const handleTransfer = async () => {
    if (!transferFromAccount || !transferToAccount || !transferAmount || parseFormattedNumber(transferAmount) <= 0) {
      toast.error('Please fill in all fields with valid values')
      return
    }

    if (transferFromAccount === transferToAccount) {
      toast.error('Cannot transfer to the same account')
      return
    }

    try {
      setIsTransferring(true)
      const amount = parseFormattedNumber(transferAmount)
      const description = transferDescription || `Transfer from ${transferFromAccount} to ${transferToAccount}`

      // Generate unique transaction numbers for both transactions
      const fromTransactionNumber = await generateUniqueTransactionNumber()
      const toTransactionNumber = await generateUniqueTransactionNumber()

      // Get current balances
      const fromAccountBalance = accountBalances.find(acc => acc.account_type === transferFromAccount)
      const toAccountBalance = accountBalances.find(acc => acc.account_type === transferToAccount)

      if (!fromAccountBalance || !toAccountBalance) {
        toast.error('Account not found')
        return
      }

      if (fromAccountBalance.current_balance < amount) {
        toast.error(`Insufficient funds in ${transferFromAccount} account`)
        return
      }

      // Create transfer out transaction
      const fromTransaction = {
        transaction_number: fromTransactionNumber,
        account_type: transferFromAccount,
        transaction_type: 'out',
        amount: amount,
        description: description,
        reference_type: 'transfer',
        reference_id: 0, // Will be set after insertion
        transaction_date: new Date().toISOString(),
        balance_after: fromAccountBalance.current_balance - amount
      }

      // Create transfer in transaction
      const toTransaction = {
        transaction_number: toTransactionNumber,
        account_type: transferToAccount,
        transaction_type: 'in',
        amount: amount,
        description: description,
        reference_type: 'transfer',
        reference_id: 0, // Will be set after insertion
        transaction_date: new Date().toISOString(),
        balance_after: toAccountBalance.current_balance + amount
      }

      // Insert both transactions
      const { data: fromResult, error: fromError } = await supabase
        .from('account_transactions')
        .insert([fromTransaction])
        .select()

      if (fromError) {
        console.error('Error creating from transaction:', fromError)
        const msg = fromError.message?.toLowerCase() || ''
        if (msg.includes('transfer') && (msg.includes('check') || msg.includes('constraint') || msg.includes('invalid'))) {
          toast.error('Transfer type not supported. Run scripts/add-transfer-reference-type.sql in Supabase.')
        } else {
          toast.error('Transfer failed: Error creating from transaction')
        }
        return
      }

      const { data: toResult, error: toError } = await supabase
        .from('account_transactions')
        .insert([toTransaction])
        .select()

      if (toError) {
        console.error('Error creating to transaction:', toError)
        const msg = toError.message?.toLowerCase() || ''
        if (msg.includes('transfer') && (msg.includes('check') || msg.includes('constraint') || msg.includes('invalid'))) {
          toast.error('Transfer type not supported. Run scripts/add-transfer-reference-type.sql in Supabase.')
        } else {
          toast.error('Transfer failed: Error creating to transaction')
        }
        return
      }

      // Update reference_id to link the transactions
      const fromId = fromResult[0].id
      const toId = toResult[0].id

      await supabase
        .from('account_transactions')
        .update({ reference_id: toId })
        .eq('id', fromId)

      await supabase
        .from('account_transactions')
        .update({ reference_id: fromId })
        .eq('id', toId)

      // Update account balances
      await supabase
        .from('account_balances')
        .update({ 
          current_balance: fromAccountBalance.current_balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('account_type', transferFromAccount)

      await supabase
        .from('account_balances')
        .update({ 
          current_balance: toAccountBalance.current_balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('account_type', transferToAccount)

      toast.success(`Successfully transferred KES ${formatNumber(amount)} from ${transferFromAccount} to ${transferToAccount}`)
      
      // Reset form and close modal
      setTransferFromAccount("")
      setTransferToAccount("")
      setTransferAmount("")
      setTransferDescription("")
      setShowTransferModal(false)
      
      // Reload account data to show updated balances
      await loadAccountData()
      
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error('Transfer failed: An unexpected error occurred')
    } finally {
      setIsTransferring(false)
    }
  }

  const getAccountIcon = (accountType: string) => {
    const iconSize = 18
    switch (accountType) {
      case 'cash':
        return <Wallet size={iconSize} />
      case 'cooperative_bank':
        return <Building size={iconSize} />
      case 'credit':
        return <CreditIcon size={iconSize} />
      case 'cheque':
        return <FileText size={iconSize} />
      case 'mpesa':
        return <Smartphone size={iconSize} />
      case 'petty_cash':
        return <Coins size={iconSize} />
      default:
        return <DollarSign size={iconSize} />
    }
  }

  const getAccountTitle = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return 'Cash'
      case 'cooperative_bank':
        return 'Cooperative Bank'
      case 'credit':
        return 'Credit'
      case 'cheque':
        return 'Cheque'
      case 'mpesa':
        return 'M-Pesa'
      case 'petty_cash':
        return 'Petty Cash'
      default:
        return accountType
    }
  }

  const getAccountGradient = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return 'cash'
      case 'cooperative_bank':
        return 'cooperative_bank'
      case 'credit':
        return 'credit'
      case 'cheque':
        return 'cheque'
      case 'mpesa':
        return 'mpesa'
      case 'petty_cash':
        return 'petty_cash'
      default:
        return 'cash'
    }
  }

  const getAccountBadgeClass = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return 'bg-success'
      case 'cooperative_bank':
        return 'bg-primary'
      case 'credit':
        return 'bg-warning'
      case 'cheque':
        return 'bg-info'
      default:
        return 'bg-secondary'
    }
  }

  // Handle account card clicks with double-tap detection
  const handleAccountCardClick = (accountType: string) => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastClickTime
    
    // Double-tap detection (within 300ms)
    if (timeDiff < 300 && activeAccountFilter === accountType) {
      // Double-tap: deactivate filter
      setActiveAccountFilter("")
      toast.success(`Removed ${getAccountTitle(accountType)} filter`)
    } else {
      // Single click: activate filter
      setActiveAccountFilter(accountType)
      toast.success(`Filtered by ${getAccountTitle(accountType)}`)
    }
    
    setLastClickTime(currentTime)
  }

  const filteredTransactions = getFilteredTransactions()

  return (
    <div>
      {/* Account Summary Cards - 6 per row, compact */}
      <div className="row g-2 mb-3">
        {accountBalances.map((account) => (
          <div key={account.account_type} className="col-6 col-md-2">
            <div 
              className={`card text-white account-summary-card account-summary-card-compact ${getAccountGradient(account.account_type)} ${
                activeAccountFilter === account.account_type ? 'active-filter' : ''
              }`}
              style={{ 
                cursor: 'pointer',
                transform: activeAccountFilter === account.account_type ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease',
                boxShadow: activeAccountFilter === account.account_type ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onClick={() => handleAccountCardClick(account.account_type)}
              title={`Click to filter by ${getAccountTitle(account.account_type)}. Double-click to clear filter.`}
            >
              <div className="card-body py-2 px-2">
                <div className="d-flex align-items-start justify-content-between gap-1">
                  <div className="flex-grow-1 min-w-0">
                    <div className="account-card-title">{getAccountTitle(account.account_type)}</div>
                    <div className="account-card-balance">KES {formatNumber(account.current_balance)}</div>
                    <div className="account-card-inout">
                      <div>In: KES {formatNumber(account.total_in)}</div>
                      <div>Out: KES {formatNumber(account.total_out)}</div>
                    </div>
                  </div>
                  <div className="account-card-icon flex-shrink-0">
                    {getAccountIcon(account.account_type)}
                  </div>
                </div>
                {activeAccountFilter === account.account_type && (
                  <div className="position-absolute top-0 end-0 p-1">
                    <div className="badge bg-light text-dark" style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem' }}>Active</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Search and Filter Row with Transfer Button */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search transactions..."
        firstFilter={{
          value: clientFilter,
          onChange: setClientFilter,
          options: [
            { value: "", label: "All Clients" },
            ...clientOptions
          ],
          placeholder: "All Clients"
        }}
        dateFilter={{
          value: dateFilter,
          onChange: setDateFilter,
          onSpecificDateChange: setSpecificDate,
          onPeriodStartChange: setPeriodStartDate,
          onPeriodEndChange: setPeriodEndDate,
          specificDate,
          periodStartDate,
          periodEndDate
        }}
        onExport={canPerformAction("export") ? exportTransactions : undefined}
        exportLabel="Export Transactions"
        compactLayout={true}
        transferButton={canPerformAction("add") ? {
          onClick: () => setShowTransferModal(true),
          label: "Transfer"
        } : undefined}
      />

      {/* Account Transactions Table */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Account Transactions</h5>
            {activeAccountFilter && (
              <div className="d-flex align-items-center">
                <span className="badge bg-primary me-2">
                  Filtered by {getAccountTitle(activeAccountFilter)}
                </span>
                <small className="text-muted">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </small>
              </div>
            )}
          </div>
          <div className="w-full overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Money In</th>
                  <th>Money Out</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {loadingBalances ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="text-muted">
                        {searchTerm || dateFilter
                          ? "No transactions found matching your criteria"
                          : "No transactions found"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`badge ${getAccountBadgeClass(transaction.account_type)}`}>
                          {getAccountTitle(transaction.account_type)}
                        </span>
                      </td>
                      <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                      <td>
                        <div className="fw-bold">{transaction.description}</div>
                        {transaction.reference_number && (
                          <small className="text-muted">
                            Ref: {transaction.reference_number}
                          </small>
                        )}
                      </td>
                      <td className="fw-bold">
                        <span className={transaction.transaction_type === 'in' ? 'text-success' : 'text-danger'}>
                          {transaction.transaction_type === 'in' ? '+' : '-'}KES {formatNumber(transaction.amount)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${transaction.transaction_type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                          {transaction.transaction_type === 'in' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="text-success fw-bold">
                        {transaction.money_in > 0 ? `KES ${formatNumber(transaction.money_in)}` : '-'}
                      </td>
                      <td className="text-danger fw-bold">
                        {transaction.money_out > 0 ? `KES ${formatNumber(transaction.money_out)}` : '-'}
                      </td>
                      <td className="fw-bold">
                        KES {formatNumber(transaction.balance_after)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Transfer Between Accounts</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTransferModal(false)}
                  disabled={isTransferring}
                ></button>
              </div>
              <div className="modal-body pt-2">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Transfer From</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={transferFromAccount}
                      onChange={(e) => setTransferFromAccount(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={isTransferring}
                    >
                      <option value="">Select Account</option>
                      {accountBalances.map((account) => (
                        <option key={account.account_type} value={account.account_type}>
                          {getAccountTitle(account.account_type)} - KES {formatNumber(account.current_balance || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Transfer To</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={transferToAccount}
                      onChange={(e) => setTransferToAccount(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={isTransferring}
                    >
                      <option value="">Select Account</option>
                      {accountBalances.map((account) => (
                        <option key={account.account_type} value={account.account_type}>
                          {getAccountTitle(account.account_type)} - KES {formatNumber(account.current_balance || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Amount</label>
                  <div className="input-group shadow-sm">
                    <span 
                      className="input-group-text border-0"
                      style={{ background: "white", borderRadius: "16px 0 0 16px", height: "45px" }}
                    >
                      KES
                    </span>
                    <FormattedNumberInput
                      className="form-control border-0"
                      placeholder=""
                      value={transferAmount}
                      onChange={(v) => setTransferAmount(v)}
                      style={{ borderRadius: "0 16px 16px 0", height: "45px", color: "#000000" }}
                      required
                      readOnly={isTransferring}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    placeholder="Enter transfer description"
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    disabled={isTransferring}
                  />
                </div>

                {/* Transfer Preview */}
                {transferFromAccount && transferToAccount && transferAmount && parseFormattedNumber(transferAmount) > 0 && (
                  <div className="alert alert-info border-0 shadow-sm" style={{ borderRadius: "16px" }}>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>From:</strong> {transferFromAccount}
                        <br />
                        <small className="text-muted">
                          Current Balance: KES {formatNumber(accountBalances.find(a => a.account_type === transferFromAccount)?.current_balance || 0)}
                        </small>
                      </div>
                      <div className="col-md-6">
                        <strong>To:</strong> {transferToAccount}
                        <br />
                        <small className="text-muted">
                          Current Balance: KES {formatNumber(accountBalances.find(a => a.account_type === transferToAccount)?.current_balance || 0)}
                        </small>
                      </div>
                    </div>
                    <hr className="my-2" />
                    <div className="text-center">
                      <strong>Transfer Amount: KES {formatNumber(parseFormattedNumber(transferAmount))}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTransferModal(false)}
                  disabled={isTransferring}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleTransfer}
                  disabled={!transferFromAccount || !transferToAccount || !transferAmount || parseFormattedNumber(transferAmount) <= 0 || isTransferring}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  {isTransferring ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-exchange-alt me-2"></i>
                      Transfer Funds
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSummaryView
