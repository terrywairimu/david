"use client"

import { useState, useEffect } from "react"
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

  // Utility function to generate unique transaction numbers
  const generateUniqueTransactionNumber = async (): Promise<string> => {
    try {
      // Get the highest transaction number to ensure uniqueness
      const { data: lastTransaction, error } = await supabase
        .from('account_transactions')
        .select('transaction_number')
        .order('transaction_number', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching last transaction number:', error)
        // Fallback to timestamp-based number
        return `TXN${Date.now().toString().slice(-6)}`
      }

      let nextNumber = 1
      if (lastTransaction && lastTransaction.length > 0) {
        const lastNumber = parseInt(lastTransaction[0].transaction_number.replace('TXN', ''))
        nextNumber = lastNumber + 1
      }

      // Double-check that the generated number doesn't already exist
      const { data: existingCheck } = await supabase
        .from('account_transactions')
        .select('id')
        .eq('transaction_number', `TXN${String(nextNumber).padStart(6, '0')}`)
        .maybeSingle()

      if (existingCheck) {
        // If the number exists, find the next available number
        const { data: allNumbers } = await supabase
          .from('account_transactions')
          .select('transaction_number')
          .order('transaction_number', { ascending: true })

        if (allNumbers && allNumbers.length > 0) {
          const numbers = allNumbers.map(t => parseInt(t.transaction_number.replace('TXN', '')))
          nextNumber = Math.max(...numbers) + 1
        }
      }

      return `TXN${String(nextNumber).padStart(6, '0')}`
    } catch (error) {
      console.error('Error generating transaction number:', error)
      // Fallback to timestamp-based number with random suffix to ensure uniqueness
      return `TXN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    }
  }

  // Utility function to check if transaction exists
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

  // Utility function to create transaction with retry logic
  const createTransactionWithRetry = async (transactionData: any, maxRetries: number = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Generate a new transaction number for each attempt to avoid duplicates
        transactionData.transaction_number = await generateUniqueTransactionNumber()
        
        const { error: insertError } = await supabase
          .from('account_transactions')
          .insert(transactionData)

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

  // Utility function to clean up duplicate transactions
  const cleanupDuplicateTransactions = async (): Promise<void> => {
    try {
      console.log('Starting duplicate transaction cleanup...')
      
      // Find and remove duplicate transactions based on reference_type and reference_id
      const { data: duplicates, error: duplicateError } = await supabase
        .from('account_transactions')
        .select('id, reference_type, reference_id, transaction_number, created_at')
        .order('created_at', { ascending: false })

      if (duplicateError) {
        console.error('Error fetching transactions for cleanup:', duplicateError)
        return
      }

      const seen = new Set<string>()
      const toDelete: number[] = []

      for (const transaction of duplicates || []) {
        const key = `${transaction.reference_type}-${transaction.reference_id}`
        if (seen.has(key)) {
          toDelete.push(transaction.id)
        } else {
          seen.add(key)
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
      
      // First, ensure all transactions from all sources are synced (only if not already syncing and needed)
      if (!isSyncing && needsSync) {
        setIsSyncing(true)
        await syncAllTransactions()
        setIsSyncing(false)
      }
      
      // Load account balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('account_balances')
        .select('*')
        .order('account_type')

      if (balancesError) throw balancesError

      // Calculate totals for each account
      const balancesWithTotals = await Promise.all(
        balancesData.map(async (balance) => {
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('account_transactions_view')
            .select('*')
            .eq('account_type', balance.account_type)

          if (transactionsError) throw transactionsError

          const totalIn = transactionsData.reduce((sum, t) => sum + t.money_in, 0)
          const totalOut = transactionsData.reduce((sum, t) => sum + t.money_out, 0)

          return {
            account_type: balance.account_type,
            current_balance: balance.current_balance,
            total_in: totalIn,
            total_out: totalOut
          }
        })
      )

      setAccountBalances(balancesWithTotals)

      // Load all transactions (not just today's) sorted by oldest to most recent
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('account_transactions_view')
        .select('*')
        .order('transaction_date', { ascending: true })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoadingBalances(false)
    }
  }

  const checkIfSyncNeeded = async () => {
    try {
      // Get counts from source tables
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })

      const { count: expensesCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })

      const { count: purchasesCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })

      // Get counts from account_transactions
      const { count: paymentTransactionsCount } = await supabase
        .from('account_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('reference_type', 'payment')

      const { count: expenseTransactionsCount } = await supabase
        .from('account_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('reference_type', 'expense')

      const { count: purchaseTransactionsCount } = await supabase
        .from('account_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('reference_type', 'purchase')

      // Check if any source has more records than transactions
      const needsSync = (
        (paymentsCount || 0) > (paymentTransactionsCount || 0) ||
        (expensesCount || 0) > (expenseTransactionsCount || 0) ||
        (purchasesCount || 0) > (purchaseTransactionsCount || 0)
      )

      console.log('Sync check:', {
        payments: paymentsCount,
        paymentTransactions: paymentTransactionsCount,
        expenses: expensesCount,
        expenseTransactions: expenseTransactionsCount,
        purchases: purchasesCount,
        purchaseTransactions: purchaseTransactionsCount,
        needsSync
      })

      return needsSync
    } catch (error) {
      console.error('Error checking if sync needed:', error)
      return true // Default to sync if we can't check
    }
  }

  const syncAllTransactions = async () => {
    try {
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

          const transactionNumber = await generateUniqueTransactionNumber()
          
          // Map payment_method to account_type
          let accountType = 'cash' // default
          if (payment.payment_method) {
            const method = payment.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          console.log('Creating payment transaction:', {
            transactionNumber,
            accountType,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.date_created
          })
          
          const success = await createTransactionWithRetry({
            transaction_number: transactionNumber,
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

          const transactionNumber = await generateUniqueTransactionNumber()
          
          // Map account_debited to proper account_type
          let accountType = 'cash' // default
          if (expense.account_debited) {
            const debited = expense.account_debited.toLowerCase()
            if (debited === 'cash' || debited === 'cooperative_bank' || debited === 'credit' || debited === 'cheque') {
              accountType = debited
            }
          }
          
          console.log('Creating expense transaction:', {
            transactionNumber,
            accountType,
            amount: expense.amount,
            account_debited: expense.account_debited,
            date_created: expense.date_created
          })
          
          const success = await createTransactionWithRetry({
            transaction_number: transactionNumber,
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

          const transactionNumber = await generateUniqueTransactionNumber()
          
          // Map payment_method to account_type
          let accountType = 'cash' // default
          if (purchase.payment_method) {
            const method = purchase.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          console.log('Creating purchase transaction:', {
            transactionNumber,
            accountType,
            amount: purchase.total_amount,
            payment_method: purchase.payment_method,
            purchase_date: purchase.purchase_date
          })
          
          const success = await createTransactionWithRetry({
            transaction_number: transactionNumber,
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
    } catch (error) {
      console.error('Error during transaction sync:', error)
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
