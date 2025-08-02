main-app.js?v=1754121510276:2281 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:314 Sync check: {payments: 11, paymentTransactions: 11, expenses: 43, expenseTransactions: 24, purchases: 18, …}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:333 Starting transaction sync...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:179 Validating database schema...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:314 Sync check: {payments: 11, paymentTransactions: 11, expenses: 43, expenseTransactions: 24, purchases: 18, …}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:333 Starting transaction sync...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:179 Validating database schema...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:192 Database schema validation passed
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:131 Starting duplicate transaction cleanup...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:192 Database schema validation passed
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:131 Starting duplicate transaction cleanup...
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:169 No duplicate transactions found
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:356 Found 11 payments to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:169 No duplicate transactions found
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:356 Found 11 payments to sync
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 1
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 2
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 3
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 11
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 14
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 12
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 13
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 14
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 13
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 15
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 17
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:423 Found 43 expenses to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:363 Payment transaction already exists for payment 16
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 8
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:423 Found 43 expenses to sync
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 8
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 70000, account_debited: 'Cash', date_created: '2025-07-11T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
eval @ react-dom-client.development.js:16309
<PaymentsPage>
exports.jsx @ react-jsx-runtime.development.js:319
ClientPageRoot @ client-page.js:20
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9894
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
eval @ react-server-dom-webpack-client.browser.development.js:2334
initializeModelChunk @ react-server-dom-webpack-client.browser.development.js:1034
resolveModelChunk @ react-server-dom-webpack-client.browser.development.js:1011
resolveModel @ react-server-dom-webpack-client.browser.development.js:1579
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2268
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ main-app.js?v=1754121510276:160
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
fn @ webpack.js?v=1754121510276:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ main-app.js?v=1754121510276:182
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
__webpack_exec__ @ main-app.js?v=1754121510276:2781
(anonymous) @ main-app.js?v=1754121510276:2782
webpackJsonpCallback @ webpack.js?v=1754121510276:1388
(anonymous) @ main-app.js?v=1754121510276:9Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 70000, account_debited: 'Cash', date_created: '2025-07-11T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
eval @ react-dom-client.development.js:16309
<PaymentsPage>
exports.jsx @ react-jsx-runtime.development.js:319
ClientPageRoot @ client-page.js:20
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9894
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
eval @ react-server-dom-webpack-client.browser.development.js:2334
initializeModelChunk @ react-server-dom-webpack-client.browser.development.js:1034
resolveModelChunk @ react-server-dom-webpack-client.browser.development.js:1011
resolveModel @ react-server-dom-webpack-client.browser.development.js:1579
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2268
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ main-app.js?v=1754121510276:160
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
fn @ webpack.js?v=1754121510276:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ main-app.js?v=1754121510276:182
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
__webpack_exec__ @ main-app.js?v=1754121510276:2781
(anonymous) @ main-app.js?v=1754121510276:2782
webpackJsonpCallback @ webpack.js?v=1754121510276:1388
(anonymous) @ main-app.js?v=1754121510276:9Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
eval @ react-dom-client.development.js:16309
<PaymentsPage>
exports.jsx @ react-jsx-runtime.development.js:319
ClientPageRoot @ client-page.js:20
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9894
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
eval @ react-server-dom-webpack-client.browser.development.js:2334
initializeModelChunk @ react-server-dom-webpack-client.browser.development.js:1034
resolveModelChunk @ react-server-dom-webpack-client.browser.development.js:1011
resolveModel @ react-server-dom-webpack-client.browser.development.js:1579
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2268
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ main-app.js?v=1754121510276:160
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
fn @ webpack.js?v=1754121510276:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ main-app.js?v=1754121510276:182
options.factory @ webpack.js?v=1754121510276:712
__webpack_require__ @ webpack.js?v=1754121510276:37
__webpack_exec__ @ main-app.js?v=1754121510276:2781
(anonymous) @ main-app.js?v=1754121510276:2782
webpackJsonpCallback @ webpack.js?v=1754121510276:1388
(anonymous) @ main-app.js?v=1754121510276:9Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 7, expense_number: 'EN2507004', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 4
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 7, expense_number: 'EN2507004', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 6
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 4
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 6
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 48220, account_debited: 'Cash', date_created: '2025-07-15T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223
await in loadAccountData
AccountSummaryView.useEffect @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:202
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
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 48220, account_debited: 'Cash', date_created: '2025-07-15T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 5, expense_number: 'EN2507002', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 9
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 5, expense_number: 'EN2507002', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 9
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 10
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 11, expense_number: 'EN2507008', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 11, expense_number: 'EN2507008', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-17T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 15, expense_number: 'EN2507012', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 15, expense_number: 'EN2507012', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 5739.96, account_debited: 'Cash', date_created: '2025-07-18T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 5739.96, account_debited: 'Cash', date_created: '2025-07-18T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 12, expense_number: 'EN2507009', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 12, expense_number: 'EN2507009', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 12176, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 12176, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 16, expense_number: 'EN2507013', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 16, expense_number: 'EN2507013', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 13540, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 13540, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 13, expense_number: 'EN2507010', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 13, expense_number: 'EN2507010', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1704, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1704, account_debited: 'Cash', date_created: '2025-07-19T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 14, expense_number: 'EN2507011', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 14, expense_number: 'EN2507011', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-20T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-20T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 18, expense_number: 'EN2507015', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 20
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 18, expense_number: 'EN2507015', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 20
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4018, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4018, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 17, expense_number: 'EN2507014', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 17, expense_number: 'EN2507014', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 69000, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 69000, account_debited: 'Cash', date_created: '2025-07-21T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 19, expense_number: 'EN2507016', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 23
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 19, expense_number: 'EN2507016', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 23
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 4000, account_debited: 'Cash', date_created: '2025-07-23T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 21, expense_number: 'EN2507018', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 21, expense_number: 'EN2507018', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 13840, account_debited: 'Cash', date_created: '2025-07-24T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 13840, account_debited: 'Cash', date_created: '2025-07-24T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 22, expense_number: 'EN2507019', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 22, expense_number: 'EN2507019', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 24
2D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 25
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 29
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 28
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 29
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 27
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 28
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 26
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 27
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 26
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 3030, account_debited: 'Cash', date_created: '2025-07-25T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 3030, account_debited: 'Cash', date_created: '2025-07-25T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 32, expense_number: 'EN2508006', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 32, expense_number: 'EN2508006', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 31
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 30
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 31
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 35
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 30
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 37
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 35
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 37
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-28T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 1000, account_debited: 'Cash', date_created: '2025-07-28T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 36, expense_number: 'EN2508008', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 36, expense_number: 'EN2508008', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 14000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 14000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 39, expense_number: 'EN2508011', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 39, expense_number: 'EN2508011', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 2000, account_debited: 'Cash', date_created: '2025-07-29T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 40, expense_number: 'EN2508012', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 40, expense_number: 'EN2508012', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 38
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 41
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 38
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 44
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 42
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 47
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 44
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 47
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-30T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-30T21:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 45, expense_number: 'EN2508017', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 46
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 45, expense_number: 'EN2508017', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 43
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 46
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:430 Expense transaction already exists for expense 43
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:445 Creating expense transaction: {transactionNumber: 'TXN000035', accountType: 'cash', amount: 400, account_debited: 'Cash', date_created: '2025-07-31T00:00:00'}
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 1 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 2 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 48, expense_number: 'EN2508020', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108 Attempt 3 failed: {code: '23505', details: 'Key (transaction_number)=(TXN000035) already exists.', hint: null, message: 'duplicate key value violates unique constraint "account_transactions_transaction_number_key"'}
error @ intercept-console-error.js:50
createTransactionWithRetry @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:108
await in createTransactionWithRetry
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:453
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:487 Error fetching purchases: {code: '42703', details: null, hint: null, message: 'column purchases.date_created does not exist'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:487
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468 Failed to create expense transaction after retries: {expense_id: 48, expense_number: 'EN2508020', account_type: 'cash', account_debited: 'Cash'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:468
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error
D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:487 Error fetching purchases: {code: '42703', details: null, hint: null, message: 'column purchases.date_created does not exist'}
error @ intercept-console-error.js:50
syncAllTransactions @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:487
await in syncAllTransactions
loadAccountData @ D:\downloads8\newcleandavidstystem945\app\payments\components\account-summary-view.tsx:223Understand this error