Sync check: {payments: 11, paymentTransactions: 11, expenses: 43, expenseTransactions: 24, purchases: 18, …}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:364 Starting transaction sync...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:210 Validating database schema...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:345 Sync check: {payments: 11, paymentTransactions: 11, expenses: 43, expenseTransactions: 24, purchases: 18, …}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:364 Starting transaction sync...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:210 Validating database schema...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223 Database schema validation passed
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:162 Starting duplicate transaction cleanup...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223 Database schema validation passed
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:162 Starting duplicate transaction cleanup...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:200 No duplicate transactions found
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:387 Found 11 payments to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:200 No duplicate transactions found
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 1
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:387 Found 11 payments to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 2
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 1
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 3
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 2
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 3
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 14
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 14
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 13
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:454 Found 43 expenses to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:394 Payment transaction already exists for payment 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:454 Found 43 expenses to sync
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 8
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000051', accountType: 'cash', amount: 70000, account_debited: 'Cash', date_created: '2025-07-11T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000051', accountType: 'cash', amount: 70000, account_debited: 'Cash', date_created: '2025-07-11T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 7
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 4
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000051) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:233
react-stack-bottom-frame @ react-dom-client.development.js:24036
runWithFiberInDEV @ react-dom-client.development.js:1511
commitHookEffectListMount @ react-dom-client.development.js:10515
commitHookPassiveMountEffects @ react-dom-client.development.js:10636
commitPassiveMountOnFiber @ react-dom-client.development.js:12442
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12529
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12504
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12529
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12504
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12454
flushPassiveEffects @ react-dom-client.development.js:15796
flushPendingEffects @ react-dom-client.development.js:15761
flushSpawnedWork @ react-dom-client.development.js:15656
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309
<AccountSummaryView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:326
renderActiveView @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:122
PaymentsPage @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:165
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 6
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000052', accountType: 'cash', amount: 48220, account_debited: 'Cash', date_created: '2025-07-15T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 7
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 4
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 5
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 6
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 9
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 5
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 9
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000054', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000054', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000054) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:233
react-stack-bottom-frame @ react-dom-client.development.js:24036
runWithFiberInDEV @ react-dom-client.development.js:1511
commitHookEffectListMount @ react-dom-client.development.js:10515
commitHookPassiveMountEffects @ react-dom-client.development.js:10636
commitPassiveMountOnFiber @ react-dom-client.development.js:12442
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12529
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12504
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12529
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12504
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12454
flushPassiveEffects @ react-dom-client.development.js:15796
flushPendingEffects @ react-dom-client.development.js:15761
flushSpawnedWork @ react-dom-client.development.js:15656
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309
<AccountSummaryView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:326
renderActiveView @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:122
PaymentsPage @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:165
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000055', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000057', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000058', accountType: 'cash', amount: 5739.96, account_debited: 'Cash', date_created: '2025-07-18T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000059', accountType: 'cash', amount: 5739.96, account_debited: 'Cash', date_created: '2025-07-18T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000059', accountType: 'cash', amount: 12176, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000059) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:233
react-stack-bottom-frame @ react-dom-client.development.js:24036
runWithFiberInDEV @ react-dom-client.development.js:1511
commitHookEffectListMount @ react-dom-client.development.js:10515
commitHookPassiveMountEffects @ react-dom-client.development.js:10636
reconnectPassiveEffects @ react-dom-client.development.js:12605
doubleInvokeEffectsOnFiber @ react-dom-client.development.js:16027
runWithFiberInDEV @ react-dom-client.development.js:1511
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15987
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
runWithFiberInDEV @ react-dom-client.development.js:1514
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:16008
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
runWithFiberInDEV @ react-dom-client.development.js:1514
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:16008
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
commitDoubleInvokeEffectsInDEV @ react-dom-client.development.js:16036
flushPassiveEffects @ react-dom-client.development.js:15806
flushPendingEffects @ react-dom-client.development.js:15761
flushSpawnedWork @ react-dom-client.development.js:15656
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309
<AccountSummaryView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:326
renderActiveView @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:122
PaymentsPage @ D:\downloads8\newcleandavidstystem945\app\payments\page.tsx:165
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
processRootScheduleInMicrotask @ react-dom-client.development.js:16175
eval @ react-dom-client.development.js:16309Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000060', accountType: 'cash', amount: 12176, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000062', accountType: 'cash', amount: 13540, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000062', accountType: 'cash', amount: 13540, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 13
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000064', accountType: 'cash', amount: 1704, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000064', accountType: 'cash', amount: 1704, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 14
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000066', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-20T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000066', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-20T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 18
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 20
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 18
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 20
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000068', accountType: 'cash', amount: 4018, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000068', accountType: 'cash', amount: 4018, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000070', accountType: 'cash', amount: 69000, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000070', accountType: 'cash', amount: 69000, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 19
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 23
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 19
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 23
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000072', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000072', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 21
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000073', accountType: 'cash', amount: 13840, account_debited: 'Cash', date_created: '2025-07-24T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 21
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 22
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 24
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000075', accountType: 'cash', amount: 13840, account_debited: 'Cash', date_created: '2025-07-24T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 25
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 29
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 28
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 22
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 27
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 24
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 26
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 25
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 29
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 28
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 27
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000076', accountType: 'cash', amount: 3030, account_debited: 'Cash', date_created: '2025-07-25T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 26
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 32
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 31
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000077', accountType: 'cash', amount: 3030, account_debited: 'Cash', date_created: '2025-07-25T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 30
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 35
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 37
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 32
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 31
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 30
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000078', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-28T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 35
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 37
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 36
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000079', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-28T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000079', accountType: 'cash', amount: 14000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 36
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000079) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000080', accountType: 'cash', amount: 14000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 39
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000082', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000082', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 40
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000082) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 38
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 44
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 40
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 47
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 38
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000084', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-30T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 44
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 47
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 45
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 45
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 46
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:461 Expense transaction already exists for expense 43
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000085', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:476 Creating expense transaction: {transactionNumber: 'TXN000085', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 48
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000085) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:484
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:522 Found 18 purchases to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 21
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:497 Successfully created expense transaction for expense 48
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:522 Found 18 purchases to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000087', accountType: 'cash', amount: 113550, payment_method: 'cash', purchase_date: '2025-07-15T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 21
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 18
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 32
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000088', accountType: 'cash', amount: 113550, payment_method: 'cash', purchase_date: '2025-07-15T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 7
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 18
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 32
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 7
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000089', accountType: 'cash', amount: 152455, payment_method: 'cash', purchase_date: '2025-07-22T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000089', accountType: 'cash', amount: 152455, payment_method: 'cash', purchase_date: '2025-07-22T00:00:00'}
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000091', accountType: 'cash', amount: 2100, payment_method: 'cash', purchase_date: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000091', accountType: 'cash', amount: 2100, payment_method: 'cash', purchase_date: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000091) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:138
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:552
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:254Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:142 Transaction number conflict on attempt 1, trying with new number...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000092', accountType: 'cash', amount: 101985, payment_method: 'bank_transfer', purchase_date: '2025-07-25T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 50
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 33
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000094', accountType: 'cash', amount: 101985, payment_method: 'bank_transfer', purchase_date: '2025-07-25T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 19
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 22
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 50
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 33
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 19
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000095', accountType: 'cash', amount: 11280, payment_method: 'cash', purchase_date: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 22
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 5
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 36
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000096', accountType: 'cash', amount: 11280, payment_method: 'cash', purchase_date: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 5
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000096', accountType: 'cash', amount: 112750, payment_method: 'bank_transfer', purchase_date: '2025-08-01T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 36
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 40
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 45
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:544 Creating purchase transaction: {transactionNumber: 'TXN000098', accountType: 'cash', amount: 112750, payment_method: 'bank_transfer', purchase_date: '2025-08-01T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 48
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 39
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:578 Transaction sync completed
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:565 Successfully created purchase transaction for purchase 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 40
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 45
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 48
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:529 Purchase transaction already exists for purchase 39
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:578 Transaction sync completed