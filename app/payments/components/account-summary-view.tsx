"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, Download, CreditCard, TrendingUp, DollarSign, Calendar, Wallet, Building, CreditCard as CreditIcon, FileText, RefreshCw } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPaymentsReport } from "@/lib/workflow-utils"
import { getCurrentNairobiTime } from "@/lib/timezone"

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
    
    // Set up real-time subscriptions for automatic updates
    const setupRealtimeSubscriptions = async () => {
      // Subscribe to payment changes
      const paymentsSubscription = supabase
        .channel('payments-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'payments' },
          (payload) => {
            console.log('Payment change detected:', payload)
            // Reload account data when payments change
            loadAccountData()
          }
        )
        .subscribe()

      // Subscribe to transaction changes
      const transactionsSubscription = supabase
        .channel('transactions-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'account_transactions' },
          (payload) => {
            console.log('Transaction change detected:', payload)
            // Reload account data when transactions change
            loadAccountData()
          }
        )
        .subscribe()

      // Subscribe to expense changes
      const expensesSubscription = supabase
        .channel('expenses-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'expenses' },
          (payload) => {
            console.log('Expense change detected:', payload)
            // Reload account data when expenses change
            loadAccountData()
          }
        )
        .subscribe()

      // Subscribe to purchase changes
      const purchasesSubscription = supabase
        .channel('purchases-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchases' },
          (payload) => {
            console.log('Purchase change detected:', payload)
            // Reload account data when purchases change
            loadAccountData()
          }
        )
        .subscribe()

      // Cleanup subscriptions on unmount
      return () => {
        paymentsSubscription.unsubscribe()
        transactionsSubscription.unsubscribe()
        expensesSubscription.unsubscribe()
        purchasesSubscription.unsubscribe()
      }
    }

    setupRealtimeSubscriptions()
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

      // Check if we've synced recently (within last 2 minutes for more frequent updates)
      const now = Date.now()
      if (now - lastSyncTime.current < 2 * 60 * 1000) {
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

      // Count transactions by reference_type
      const { count: paymentTransactionCount } = await supabase
        .from('account_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('reference_type', 'payment')

      const { count: expenseTransactionCount } = await supabase
        .from('account_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('reference_type', 'expense')

      const { count: purchaseTransactionCount } = await supabase
        .from('account_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('reference_type', 'purchase')

      const totalRecords = (paymentCount || 0) + (expenseCount || 0) + (purchaseCount || 0)
      const totalTransactions = (paymentTransactionCount || 0) + (expenseTransactionCount || 0) + (purchaseTransactionCount || 0)

      console.log('Sync check:', {
        payments: paymentCount,
        paymentTransactions: paymentTransactionCount,
        expenses: expenseCount,
        expenseTransactions: expenseTransactionCount,
        purchases: purchaseCount,
        purchaseTransactions: purchaseTransactionCount,
        totalRecords,
        totalTransactions
      })

      // Check if sync is needed by comparing source records with transactions
      const needsPaymentSync = (paymentCount || 0) > (paymentTransactionCount || 0)
      const needsExpenseSync = (expenseCount || 0) > (expenseTransactionCount || 0)
      const needsPurchaseSync = (purchaseCount || 0) > (purchaseTransactionCount || 0)
      
      const needsSync = needsPaymentSync || needsExpenseSync || needsPurchaseSync
      
      return needsSync
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
            // Update existing transaction if payment data has changed
            const { data: existingTransaction } = await supabase
              .from('account_transactions')
              .select('*')
              .eq('reference_type', 'payment')
              .eq('reference_id', payment.id)
              .single()

            if (existingTransaction) {
              // Map payment_method to account_type - use account_credited if available, otherwise use payment_method
              let accountType = 'cash' // default
              if (payment.account_credited) {
                const credited = payment.account_credited
                if (credited === 'Cash') {
                  accountType = 'cash'
                } else if (credited === 'Cooperative Bank') {
                  accountType = 'cooperative_bank'
                } else if (credited === 'Credit') {
                  accountType = 'credit'
                } else if (credited === 'Cheque') {
                  accountType = 'cheque'
                }
              } else if (payment.payment_method) {
                const method = payment.payment_method.toLowerCase()
                if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
                  accountType = method
                }
              }

              // Check if account type has changed
              const accountTypeChanged = existingTransaction.account_type !== accountType
              
              // Check if payment data has changed
              const paymentChanged = 
                existingTransaction.amount !== payment.amount ||
                existingTransaction.description !== (payment.description || payment.payment_number) ||
                existingTransaction.transaction_date !== (payment.payment_date || payment.date_paid || payment.date_created)

              if (accountTypeChanged || paymentChanged) {
                console.log(`Updating existing transaction for payment ${payment.id} due to data changes`)
                
                // If account type changed, delete and recreate the transaction
                if (accountTypeChanged) {
                  console.log(`Account type changed from ${existingTransaction.account_type} to ${accountType}, recreating transaction`)
                  
                  // Delete the existing transaction
                  const { error: deleteError } = await supabase
                    .from('account_transactions')
                    .delete()
                    .eq('reference_type', 'payment')
                    .eq('reference_id', payment.id)

                  if (deleteError) {
                    console.error(`Error deleting transaction for payment ${payment.id}:`, deleteError)
                    continue
                  }

                  // Create new transaction with correct account type
                  const success = await createTransactionWithRetry({
                    account_type: accountType,
                    transaction_type: 'in',
                    amount: payment.amount,
                    description: payment.description || payment.payment_number,
                    reference_type: 'payment',
                    reference_id: payment.id,
                    transaction_date: payment.payment_date || payment.date_paid || payment.date_created,
                    balance_after: 0 // Will be calculated by trigger
                  })

                  if (success) {
                    console.log(`Successfully recreated transaction for payment ${payment.id} with account type ${accountType}`)
                  } else {
                    console.error('Failed to recreate payment transaction after retries:', {
                      payment_id: payment.id,
                      payment_number: payment.payment_number,
                      account_type: accountType
                    })
                  }
                } else {
                  // Only update other fields, not account type
                  const { error: updateError } = await supabase
                    .from('account_transactions')
                    .update({
                      amount: payment.amount,
                      description: payment.description || payment.payment_number,
                      transaction_date: payment.payment_date || payment.date_paid || payment.date_created,
                      updated_at: getCurrentNairobiTime().toISOString()
                    })
                    .eq('reference_type', 'payment')
                    .eq('reference_id', payment.id)

                  if (updateError) {
                    console.error(`Error updating transaction for payment ${payment.id}:`, updateError)
                  } else {
                    console.log(`Successfully updated transaction for payment ${payment.id}`)
                  }
                }
              } else {
                console.log(`Payment transaction already exists and unchanged for payment ${payment.id}`)
              }
              continue
            }
          }

          // Map payment_method to account_type - use account_credited if available, otherwise use payment_method
          let accountType = 'cash' // default
          if (payment.account_credited) {
            const credited = payment.account_credited
            if (credited === 'Cash') {
              accountType = 'cash'
            } else if (credited === 'Cooperative Bank') {
              accountType = 'cooperative_bank'
            } else if (credited === 'Credit') {
              accountType = 'credit'
            } else if (credited === 'Cheque') {
              accountType = 'cheque'
            }
          } else if (payment.payment_method) {
            const method = payment.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          console.log('Creating payment transaction:', {
            accountType,
            amount: payment.amount,
            payment_method: payment.payment_method,
            account_credited: payment.account_credited,
            payment_date: payment.payment_date || payment.date_paid || payment.date_created,
            description: payment.description
          })
          
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'in',
            amount: payment.amount,
            description: payment.description || payment.payment_number,
            reference_type: 'payment',
            reference_id: payment.id,
            transaction_date: payment.payment_date || payment.date_paid || payment.date_created,
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
            // Update existing transaction if expense data has changed
            const { data: existingTransaction } = await supabase
              .from('account_transactions')
              .select('*')
              .eq('reference_type', 'expense')
              .eq('reference_id', expense.id)
              .single()

            if (existingTransaction) {
              // Map account_debited to proper account_type
              let accountType = 'cash' // default
              if (expense.account_debited) {
                const debited = expense.account_debited
                if (debited === 'Cash') {
                  accountType = 'cash'
                } else if (debited === 'Cooperative Bank') {
                  accountType = 'cooperative_bank'
                } else if (debited === 'Credit') {
                  accountType = 'credit'
                } else if (debited === 'Cheque') {
                  accountType = 'cheque'
                }
              }

              // Check if account type has changed
              const accountTypeChanged = existingTransaction.account_type !== accountType
              
              // Get the real description from expense_items using the same structure as frontend views
              const { data: expenseItems } = await supabase
                .from('expense_items')
                .select('description, quantity, rate')
                .eq('expense_id', expense.id)
                .order('created_at', { ascending: false })

              // Use the exact same formatExpenseItems logic as the frontend views
              const formatExpenseItems = (items: any[]) => {
                if (items.length === 0) return expense.expense_number
                if (items.length === 1) {
                  const item = items[0]
                  return item.quantity === 1 ? `${item.description} @ ${item.rate}` : `${item.quantity} ${item.description} @ ${item.rate}`
                }
                return `${items.length} items: ${items.map(i => i.quantity === 1 ? `${i.description} @ ${i.rate}` : `${i.quantity} ${i.description} @ ${i.rate}`).join(", ")}`
              }

              const realDescription = formatExpenseItems(expenseItems || [])
              
              // Check if expense data has changed
              const expenseChanged = 
                existingTransaction.amount !== expense.amount ||
                existingTransaction.description !== realDescription ||
                existingTransaction.transaction_date !== new Date(expense.date_created).toISOString().split('T')[0]

              if (accountTypeChanged || expenseChanged) {
                console.log(`Updating existing transaction for expense ${expense.id} due to data changes`)
                
                // If account type changed, delete and recreate the transaction
                if (accountTypeChanged) {
                  console.log(`Account type changed from ${existingTransaction.account_type} to ${accountType}, recreating transaction`)
                  
                  // Delete the existing transaction
                  const { error: deleteError } = await supabase
                    .from('account_transactions')
                    .delete()
                    .eq('reference_type', 'expense')
                    .eq('reference_id', expense.id)

                  if (deleteError) {
                    console.error(`Error deleting transaction for expense ${expense.id}:`, deleteError)
                    continue
                  }

                  // Create new transaction with correct account type
                  const success = await createTransactionWithRetry({
                    account_type: accountType,
                    transaction_type: 'out',
                    amount: expense.amount,
                    description: realDescription,
                    reference_type: 'expense',
                    reference_id: expense.id,
                    transaction_date: new Date(expense.date_created).toISOString().split('T')[0],
                    balance_after: 0 // Will be calculated by trigger
                  })

                  if (success) {
                    console.log(`Successfully recreated transaction for expense ${expense.id} with account type ${accountType}`)
                  } else {
                    console.error('Failed to recreate expense transaction after retries:', {
                      expense_id: expense.id,
                      expense_number: expense.expense_number,
                      account_type: accountType,
                      account_debited: expense.account_debited
                    })
                  }
                } else {
                  // Only update other fields, not account type
                  const { error: updateError } = await supabase
                    .from('account_transactions')
                    .update({
                      amount: expense.amount,
                      description: realDescription,
                      transaction_date: new Date(expense.date_created).toISOString().split('T')[0],
                      updated_at: getCurrentNairobiTime().toISOString()
                    })
                    .eq('reference_type', 'expense')
                    .eq('reference_id', expense.id)

                  if (updateError) {
                    console.error(`Error updating transaction for expense ${expense.id}:`, updateError)
                  } else {
                    console.log(`Successfully updated transaction for expense ${expense.id}`)
                  }
                }
              } else {
                console.log(`Expense transaction already exists and unchanged for expense ${expense.id}`)
              }
              continue
            }
          }

          // Map account_debited to proper account_type
          let accountType = 'cash' // default
          if (expense.account_debited) {
            const debited = expense.account_debited
            if (debited === 'Cash') {
              accountType = 'cash'
            } else if (debited === 'Cooperative Bank') {
              accountType = 'cooperative_bank'
            } else if (debited === 'Credit') {
              accountType = 'credit'
            } else if (debited === 'Cheque') {
              accountType = 'cheque'
            }
          }
          
          console.log('Creating expense transaction:', {
            accountType,
            amount: expense.amount,
            account_debited: expense.account_debited,
            date_created: expense.date_created
          })
          
          // Get the real description from expense_items using the same structure as frontend views
          const { data: expenseItems } = await supabase
            .from('expense_items')
            .select('description, quantity, rate')
            .eq('expense_id', expense.id)
            .order('created_at', { ascending: false })

          // Use the exact same formatExpenseItems logic as the frontend views
          const formatExpenseItems = (items: any[]) => {
            if (items.length === 0) return expense.expense_number
            if (items.length === 1) {
              const item = items[0]
              return item.quantity === 1 ? `${item.description} @ ${item.rate}` : `${item.quantity} ${item.description} @ ${item.rate}`
            }
            return `${items.length} items: ${items.map(i => i.quantity === 1 ? `${i.description} @ ${i.rate}` : `${i.quantity} ${i.description} @ ${i.rate}`).join(", ")}`
          }

          const realDescription = formatExpenseItems(expenseItems || [])

          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: expense.amount,
            description: realDescription,
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
          // Check if transaction already exists with better error handling
          const exists = await checkTransactionExists('purchase', purchase.id)
          
          if (exists) {
            // Update existing transaction if purchase data has changed
            const { data: existingTransaction } = await supabase
              .from('account_transactions')
              .select('*')
              .eq('reference_type', 'purchase')
              .eq('reference_id', purchase.id)
              .single()

            if (existingTransaction) {
              // Map payment_method to account_type
              let accountType = 'cash' // default
              if (purchase.payment_method) {
                const method = purchase.payment_method.toLowerCase()
                if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
                  accountType = method
                }
              }

              // Check if account type has changed
              const accountTypeChanged = existingTransaction.account_type !== accountType
              
              // Get the real description from purchase_items and stock_items using the same structure as frontend views
              const { data: purchaseItems } = await supabase
                .from('purchase_items')
                .select(`
                  stock_item_id,
                  quantity,
                  stock_items (
                    name,
                    description,
                    unit
                  )
                `)
                .eq('purchase_id', purchase.id)
                .order('id', { ascending: false })

              // Use the exact same logic as the frontend views
              const formatPurchaseItems = (items: any[]) => {
                if (items.length === 0) return purchase.purchase_order_number
                if (items.length === 1) {
                  const item = items[0]
                  const description = (
                    item.stock_items?.description && item.stock_items.description.trim() !== ''
                      ? item.stock_items.description
                      : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                          ? item.stock_items.name
                          : 'N/A')
                  )
                  return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
                }
                return `${items.length} items: ${items.map(item => {
                  const description = (
                    item.stock_items?.description && item.stock_items.description.trim() !== ''
                      ? item.stock_items.description
                      : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                          ? item.stock_items.name
                          : 'N/A')
                  )
                  return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
                }).join(", ")}`
              }

              const realDescription = formatPurchaseItems(purchaseItems || [])
              
              // Check if purchase data has changed
              const purchaseChanged = 
                existingTransaction.amount !== purchase.total_amount ||
                existingTransaction.description !== realDescription ||
                existingTransaction.transaction_date !== purchase.purchase_date

              if (accountTypeChanged || purchaseChanged) {
                console.log(`Updating existing transaction for purchase ${purchase.id} due to data changes`)
                
                // If account type changed, delete and recreate the transaction
                if (accountTypeChanged) {
                  console.log(`Account type changed from ${existingTransaction.account_type} to ${accountType}, recreating transaction`)
                  
                  // Delete the existing transaction
                  const { error: deleteError } = await supabase
                    .from('account_transactions')
                    .delete()
                    .eq('reference_type', 'purchase')
                    .eq('reference_id', purchase.id)

                  if (deleteError) {
                    console.error(`Error deleting transaction for purchase ${purchase.id}:`, deleteError)
                    continue
                  }

                  // Create new transaction with correct account type
                  const success = await createTransactionWithRetry({
                    account_type: accountType,
                    transaction_type: 'out',
                    amount: purchase.total_amount,
                    description: realDescription,
                    reference_type: 'purchase',
                    reference_id: purchase.id,
                    transaction_date: purchase.purchase_date,
                    balance_after: 0 // Will be calculated by trigger
                  })

                  if (success) {
                    console.log(`Successfully recreated transaction for purchase ${purchase.id} with account type ${accountType}`)
                  } else {
                    console.error('Failed to recreate purchase transaction after retries:', {
                      purchase_id: purchase.id,
                      purchase_number: purchase.purchase_order_number,
                      account_type: accountType
                    })
                  }
                } else {
                  // Only update other fields, not account type
                  const { error: updateError } = await supabase
                    .from('account_transactions')
                    .update({
                      amount: purchase.total_amount,
                      description: realDescription,
                      transaction_date: purchase.purchase_date,
                      updated_at: getCurrentNairobiTime().toISOString()
                    })
                    .eq('reference_type', 'purchase')
                    .eq('reference_id', purchase.id)

                  if (updateError) {
                    console.error(`Error updating transaction for purchase ${purchase.id}:`, updateError)
                  } else {
                    console.log(`Successfully updated transaction for purchase ${purchase.id}`)
                  }
                }
              } else {
                console.log(`Purchase transaction already exists and unchanged for purchase ${purchase.id}`)
              }
              continue
            }
          }

          // Map payment_method to account_type
          let accountType = 'cash' // default
          if (purchase.payment_method) {
            const method = purchase.payment_method.toLowerCase()
            if (method === 'cash' || method === 'cooperative_bank' || method === 'credit' || method === 'cheque') {
              accountType = method
            }
          }
          
          // Get the real description from purchase_items and stock_items using the same structure as frontend views
          const { data: purchaseItems } = await supabase
            .from('purchase_items')
            .select(`
              stock_item_id,
              quantity,
              stock_items (
                name,
                description,
                unit
              )
            `)
            .eq('purchase_id', purchase.id)
            .order('id', { ascending: false })

          // Use the exact same logic as the frontend views
          const formatPurchaseItems = (items: any[]) => {
            if (items.length === 0) return purchase.purchase_order_number
            if (items.length === 1) {
              const item = items[0]
              const description = (
                item.stock_items?.description && item.stock_items.description.trim() !== ''
                  ? item.stock_items.description
                  : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                      ? item.stock_items.name
                      : 'N/A')
              )
              return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
            }
            return `${items.length} items: ${items.map(item => {
              const description = (
                item.stock_items?.description && item.stock_items.description.trim() !== ''
                  ? item.stock_items.description
                  : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                      ? item.stock_items.name
                      : 'N/A')
              )
              return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
            }).join(", ")}`
          }

          const realDescription = formatPurchaseItems(purchaseItems || [])

          console.log('Creating purchase transaction:', {
            accountType,
            amount: purchase.total_amount,
            payment_method: purchase.payment_method,
            purchase_date: purchase.purchase_date,
            description: realDescription
          })
          
          const success = await createTransactionWithRetry({
            account_type: accountType,
            transaction_type: 'out',
            amount: purchase.total_amount,
            description: realDescription,
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

      // Ensure account_balances table is in sync with transactions
      await loadAccountBalances()

      // Force refresh the UI
      await loadTransactions()
      
      // Force a re-render by updating state
      setAccountBalances(prev => [...prev])

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
      // Get all transactions and calculate balances from the view
      const { data: transactions, error } = await supabase
        .from('account_transactions_view')
        .select('account_type, money_in, money_out')

      if (error) {
        console.error('Error loading transactions for balance calculation:', error)
        return
      }

      // Calculate balances for each account type
      const balanceMap = new Map<string, { total_in: number; total_out: number; current_balance: number }>()

      // Initialize all account types with zero balances
      const allAccountTypes = ['cash', 'cooperative_bank', 'credit', 'cheque']
      allAccountTypes.forEach(accountType => {
        balanceMap.set(accountType, { total_in: 0, total_out: 0, current_balance: 0 })
      })

      // Calculate from actual transactions using money_in and money_out
      for (const transaction of transactions || []) {
        const accountType = transaction.account_type || 'cash'
        const current = balanceMap.get(accountType) || { total_in: 0, total_out: 0, current_balance: 0 }

        current.total_in += transaction.money_in || 0
        current.total_out += transaction.money_out || 0
        current.current_balance += (transaction.money_in || 0) - (transaction.money_out || 0)

        balanceMap.set(accountType, current)
      }

      // Update account_balances table with calculated values
      for (const [accountType, balance] of balanceMap.entries()) {
        const { error: updateError } = await supabase
          .from('account_balances')
          .update({
            current_balance: balance.current_balance,
            last_transaction_date: getCurrentNairobiTime().toISOString(),
            updated_at: getCurrentNairobiTime().toISOString()
          })
          .eq('account_type', accountType)

        if (updateError) {
          console.error(`Error updating balance for ${accountType}:`, updateError)
        } else {
          console.log(`Updated ${accountType} balance to: ${balance.current_balance}`)
        }
      }

      // Set the account balances for display
      const accountBalancesArray = Array.from(balanceMap.entries()).map(([account_type, balance]) => ({
        account_type: account_type,
        current_balance: balance.current_balance,
        total_in: balance.total_in,
        total_out: balance.total_out
      }))

      setAccountBalances(accountBalancesArray)
      console.log('Account balances updated:', accountBalancesArray)
    } catch (error) {
      console.error('Error loading account balances:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const { data: transactionsData, error } = await supabase
        .from('account_transactions_view')
        .select('*')

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

    // Account filter - filter by active account type
    if (activeAccountFilter) {
      filtered = filtered.filter(transaction => 
        transaction.account_type === activeAccountFilter
      )
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
  const exportTransactions = (format: 'pdf' | 'csv') => {
    const filteredData = getFilteredTransactions()
    if (format === 'csv') {
      handleExport() // Use existing CSV export
    } else {
      // For PDF, we'll use a simplified payments export since this is account transactions
      const paymentsData = filteredData.map(transaction => ({
        payment_number: transaction.transaction_number,
        client: { name: transaction.client_name || 'System' },
        date_created: transaction.transaction_date,
        paid_to: transaction.account_type,
        description: transaction.description,
        amount: transaction.amount,
        account_credited: transaction.account_type
      }))
      exportPaymentsReport(paymentsData, format)
    }
  }

  const handleExport = async () => {
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
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    }
  }

  // Handle transfer between accounts
  const handleTransfer = async () => {
    if (!transferFromAccount || !transferToAccount || !transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Please fill in all fields with valid values')
      return
    }

    if (transferFromAccount === transferToAccount) {
      toast.error('Cannot transfer to the same account')
      return
    }

    try {
      setIsTransferring(true)
      const amount = parseFloat(transferAmount)
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
        toast.error('Transfer failed: Error creating from transaction')
        return
      }

      const { data: toResult, error: toError } = await supabase
        .from('account_transactions')
        .insert([toTransaction])
        .select()

      if (toError) {
        console.error('Error creating to transaction:', toError)
        toast.error('Transfer failed: Error creating to transaction')
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

      toast.success(`Successfully transferred KES ${amount.toFixed(2)} from ${transferFromAccount} to ${transferToAccount}`)
      
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
      {/* Account Summary Cards */}
      <div className="row mb-4">
        {accountBalances.map((account) => (
          <div key={account.account_type} className="col-md-3 mb-3">
            <div 
              className={`card text-white account-summary-card ${getAccountGradient(account.account_type)} ${
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
                {activeAccountFilter === account.account_type && (
                  <div className="position-absolute top-0 end-0 p-2">
                    <div className="badge bg-light text-dark">Active Filter</div>
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
                          {account.account_type} - KES {account.current_balance?.toFixed(2) || '0.00'}
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
                          {account.account_type} - KES {account.current_balance?.toFixed(2) || '0.00'}
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
                    <input
                      type="number"
                      className="form-control border-0"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      style={{ borderRadius: "0 16px 16px 0", height: "45px", color: "#000000" }}
                      required
                      disabled={isTransferring}
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
                {transferFromAccount && transferToAccount && transferAmount && parseFloat(transferAmount) > 0 && (
                  <div className="alert alert-info border-0 shadow-sm" style={{ borderRadius: "16px" }}>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>From:</strong> {transferFromAccount}
                        <br />
                        <small className="text-muted">
                          Current Balance: KES {accountBalances.find(a => a.account_type === transferFromAccount)?.current_balance?.toFixed(2) || '0.00'}
                        </small>
                      </div>
                      <div className="col-md-6">
                        <strong>To:</strong> {transferToAccount}
                        <br />
                        <small className="text-muted">
                          Current Balance: KES {accountBalances.find(a => a.account_type === transferToAccount)?.current_balance?.toFixed(2) || '0.00'}
                        </small>
                      </div>
                    </div>
                    <hr className="my-2" />
                    <div className="text-center">
                      <strong>Transfer Amount: KES {parseFloat(transferAmount).toFixed(2)}</strong>
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
                  disabled={!transferFromAccount || !transferToAccount || !transferAmount || parseFloat(transferAmount) <= 0 || isTransferring}
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
