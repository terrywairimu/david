"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, Download, CreditCard, TrendingUp, DollarSign, Calendar, Wallet, Building, CreditCard as CreditIcon, FileText } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPayments } from "@/lib/workflow-utils"

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
}

const AccountSummaryView = ({ clients, payments, loading, onRefresh }: AccountSummaryViewProps) => {
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
  
  // Add refs to prevent duplicate operations
  const syncInProgress = useRef(false)
  const lastSyncTime = useRef<number>(0)
  const transactionNumberCounter = useRef<number>(0)

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

  useEffect(() => {
    setupClientOptions()
    loadAccountData()
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
      
      // Load account balances and transactions
      await loadAccountBalances()
      await loadTransactions()
    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoadingBalances(false)
    }
  }

  const checkIfSyncNeeded = async (): Promise<boolean> => {
    try {
      // Prevent multiple simultaneous syncs
      if (syncInProgress.current) {
        console.log('Sync already in progress, skipping...')
        return false
      }

      // Check if we've synced recently (within last 5 minutes)
      const now = Date.now()
      if (now - lastSyncTime.current < 5 * 60 * 1000) {
        console.log('Sync performed recently, skipping...')
        return false
      }

      // Check if there are any transactions that need syncing
      const { count: paymentCount } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })

      const { count: expenseCount } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })

      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })

      const { count: transactionCount } = await supabase
        .from('account_transactions')
        .select('id', { count: 'exact', head: true })

      const totalRecords = (paymentCount || 0) + (expenseCount || 0) + (purchaseCount || 0)
      const totalTransactions = transactionCount || 0

      console.log('Sync check:', {
        payments: paymentCount,
        paymentTransactions: transactionCount,
        expenses: expenseCount,
        expenseTransactions: transactionCount,
        purchases: purchaseCount,
        totalRecords,
        totalTransactions
      })

      // If we have records but no transactions, or if the numbers don't match, sync is needed
      return totalRecords > 0 && totalTransactions === 0
    } catch (error) {
      console.error('Error checking if sync needed:', error)
      return false
    }
  }

  const syncAllTransactions = async () => {
    // Prevent multiple simultaneous syncs
    if (syncInProgress.current) {
      console.log('Sync already in progress, skipping...')
      return
    }

    try {
      syncInProgress.current = true
      setIsSyncing(true)
      console.log('Starting transaction sync...')
      
      // Validate database schema first
      const schemaValid = await validateDatabaseSchema()
      if (!schemaValid) {
        console.error('Database schema validation failed. Aborting sync.')
        return
      }
      
      // First, clean up any existing duplicates
      await cleanupDuplicateTransactions()

      // Sync payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('date_created')

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
        return
      }

      console.log(`Found ${payments?.length || 0} payments to sync`)

      for (const payment of payments || []) {
        try {
          // Check if transaction already exists with better error handling
          const exists = await checkTransactionExists('payment', payment.id)
          if (exists) {
            console.log(`Payment transaction already exists for payment ${payment.id}`)
            continue
          }

          // Map payment_method to account_type
          let accountType = 'cash' // default
          if (payment.payment_method) {
            const method = payment.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          console.log('Creating payment transaction:', {
            accountType,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.date_created
          })
          
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'in',
            amount: payment.amount,
            description: payment.description || `Payment received - ${payment.payment_number}`,
            reference_type: 'payment',
            reference_id: payment.id,
            transaction_date: payment.payment_date || payment.date_created,
            balance_after: 0 // Will be calculated by trigger
          })

          if (success) {
            console.log(`Successfully created payment transaction for payment ${payment.id}`)
          } else {
            console.error('Failed to create payment transaction after retries:', {
              payment_id: payment.id,
              payment_number: payment.payment_number,
              account_type: accountType
            })
          }
        } catch (error) {
          console.error(`Error processing payment ${payment.id}:`, error)
        }
      }

      // Sync expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date_created')

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError)
        return
      }

      console.log(`Found ${expenses?.length || 0} expenses to sync`)

      for (const expense of expenses || []) {
        try {
          // Check if transaction already exists with better error handling
          const exists = await checkTransactionExists('expense', expense.id)
          if (exists) {
            console.log(`Expense transaction already exists for expense ${expense.id}`)
            continue
          }

          // Map account_debited to proper account_type
          let accountType = 'cash' // default
          if (expense.account_debited) {
            const debited = expense.account_debited.toLowerCase()
            if (debited === 'cash' || debited === 'cooperative_bank' || debited === 'credit' || debited === 'cheque') {
              accountType = debited
            }
          }
          
          console.log('Creating expense transaction:', {
            accountType,
            amount: expense.amount,
            account_debited: expense.account_debited,
            date_created: expense.date_created
          })
          
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: expense.amount,
            description: expense.description || `Expense - ${expense.expense_number}`,
            reference_type: 'expense',
            reference_id: expense.id,
            transaction_date: new Date(expense.date_created).toISOString().split('T')[0],
            balance_after: 0 // Will be calculated by trigger
          })

          if (success) {
            console.log(`Successfully created expense transaction for expense ${expense.id}`)
          } else {
            console.error('Failed to create expense transaction after retries:', {
              expense_id: expense.id,
              expense_number: expense.expense_number,
              account_type: accountType,
              account_debited: expense.account_debited
            })
          }
        } catch (error) {
          console.error(`Error processing expense ${expense.id}:`, error)
        }
      }

      // Sync purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date')

      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError)
        return
      }

      console.log(`Found ${purchases?.length || 0} purchases to sync`)

      for (const purchase of purchases || []) {
        try {
          // Check if transaction already exists
          const exists = await checkTransactionExists('purchase', purchase.id)
          if (exists) {
            console.log(`Purchase transaction already exists for purchase ${purchase.id}`)
            continue
          }

          // Map payment_method to account_type
          let accountType = 'cash' // default
          if (purchase.payment_method) {
            const method = purchase.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          console.log('Creating purchase transaction:', {
            accountType,
            amount: purchase.total_amount,
            payment_method: purchase.payment_method,
            purchase_date: purchase.purchase_date
          })
          
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: purchase.total_amount,
            description: `Purchase - ${purchase.purchase_order_number}`,
            reference_type: 'purchase',
            reference_id: purchase.id,
            transaction_date: purchase.purchase_date,
            balance_after: 0 // Will be calculated by trigger
          })

          if (success) {
            console.log(`Successfully created purchase transaction for purchase ${purchase.id}`)
          } else {
            console.error('Failed to create purchase transaction after retries:', {
              purchase_id: purchase.id,
              purchase_number: purchase.purchase_order_number,
              account_type: accountType
            })
          }
        } catch (error) {
          console.error(`Error processing purchase ${purchase.id}:`, error)
        }
      }

      console.log('Transaction sync completed')
      lastSyncTime.current = Date.now()
    } catch (error) {
      console.error('Error during transaction sync:', error)
    } finally {
      syncInProgress.current = false
      setIsSyncing(false)
    }
  }

  const loadAccountBalances = async () => {
    try {
      const { data: balances, error } = await supabase
        .from('account_transactions')
        .select('account_type, transaction_type, amount')
        .order('transaction_date', { ascending: true })

      if (error) {
        console.error('Error loading account balances:', error)
        return
      }

      // Calculate balances for each account type
      const balanceMap = new Map<string, { total_in: number; total_out: number; current_balance: number }>()

      for (const transaction of balances || []) {
        const accountType = transaction.account_type || 'cash'
        const current = balanceMap.get(accountType) || { total_in: 0, total_out: 0, current_balance: 0 }

        if (transaction.transaction_type === 'in') {
          current.total_in += transaction.amount
          current.current_balance += transaction.amount
        } else {
          current.total_out += transaction.amount
          current.current_balance -= transaction.amount
        }

        balanceMap.set(accountType, current)
      }

      const accountBalancesArray = Array.from(balanceMap.entries()).map(([account_type, balance]) => ({
        account_type: account_type,
        current_balance: balance.current_balance,
        total_in: balance.total_in,
        total_out: balance.total_out
      }))

      setAccountBalances(accountBalancesArray)
    } catch (error) {
      console.error('Error loading account balances:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const { data: transactionsData, error } = await supabase
        .from('account_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading transactions:', error)
        return
      }

      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const getFilteredTransactions = () => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter - filter by reference if it's a payment
    if (clientFilter) {
      filtered = filtered.filter(transaction => {
        // For payments, we can filter by client_id in the reference
        if (transaction.reference_type === 'payment') {
          // This would need to be enhanced to actually check client_id from payments table
          return true // For now, show all transactions
        }
        return true
      })
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

    // Always sort by most recent first
    return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
  }

  const handleExport = () => {
    const filteredTransactions = getFilteredTransactions()
    
    // Create CSV content
    const headers = ['Transaction #', 'Account', 'Date', 'Description', 'Amount', 'Status', 'Money In', 'Money Out', 'Balance']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        transaction.transaction_number,
        getAccountTitle(transaction.account_type),
        new Date(transaction.transaction_date).toLocaleDateString(),
        `"${transaction.description}"`,
        transaction.amount.toFixed(2),
        transaction.transaction_type === 'in' ? 'In' : 'Out',
        transaction.money_in.toFixed(2),
        transaction.money_out.toFixed(2),
        transaction.balance_after.toFixed(2)
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
  }

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return <Wallet size={24} />
      case 'cooperative_bank':
        return <Building size={24} />
      case 'credit':
        return <CreditIcon size={24} />
      case 'cheque':
        return <FileText size={24} />
      default:
        return <DollarSign size={24} />
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

  const filteredTransactions = getFilteredTransactions()

  return (
    <div>
      {/* Account Summary Cards */}
      <div className="row mb-4">
        {accountBalances.map((account) => (
          <div key={account.account_type} className="col-md-3 mb-3">
            <div className={`card text-white account-summary-card ${getAccountGradient(account.account_type)}`}>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="flex-grow-1">
                    <div className="small opacity-90">{getAccountTitle(account.account_type)}</div>
                    <div className="h5 mb-0 fw-bold">KES {account.current_balance.toFixed(2)}</div>
                    <div className="small mt-2 opacity-90">
                      <div>In: KES {account.total_in.toFixed(2)}</div>
                      <div>Out: KES {account.total_out.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="ms-3">
                    {getAccountIcon(account.account_type)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Search and Filter Row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search transactions..."
          firstFilter={{
            value: clientFilter,
            onChange: setClientFilter,
            options: clientOptions,
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
          onExport={handleExport}
          exportLabel="Export Transactions"
        />
        
        {/* Manual Sync Button */}
        <div className="d-flex align-items-center gap-2">
          {isSyncing && (
            <div className="d-flex align-items-center text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Syncing...</span>
              </div>
              <small>Syncing transactions...</small>
            </div>
          )}
          <button
            onClick={syncAllTransactions}
            disabled={isSyncing}
            className="btn btn-outline-primary btn-sm"
            title="Manually sync all transactions"
          >
            <Eye size={16} className="me-1" />
            {isSyncing ? 'Syncing...' : 'Sync Transactions'}
          </button>
        </div>
      </div>

      {/* Account Transactions Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
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
                          {transaction.transaction_type === 'in' ? '+' : '-'}KES {transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${transaction.transaction_type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                          {transaction.transaction_type === 'in' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="text-success fw-bold">
                        {transaction.money_in > 0 ? `KES ${transaction.money_in.toFixed(2)}` : '-'}
                      </td>
                      <td className="text-danger fw-bold">
                        {transaction.money_out > 0 ? `KES ${transaction.money_out.toFixed(2)}` : '-'}
                      </td>
                      <td className="fw-bold">
                        KES {transaction.balance_after.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSummaryView
