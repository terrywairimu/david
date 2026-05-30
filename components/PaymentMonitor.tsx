'use client'

import { useEffect } from 'react'
import { paymentMonitor } from '@/lib/real-time-payment-monitor'

export default function PaymentMonitor() {
  useEffect(() => {
    // Start real-time payment monitoring when component mounts
    paymentMonitor.startMonitoring()

    // Catch up on missed conversions (throttled to once per session)
    const lastRun = sessionStorage.getItem('processAllQuotationsLastRun')
    const now = Date.now()
    if (!lastRun || now - parseInt(lastRun, 10) > 300000) {
      paymentMonitor.processAllQuotations().then(() => {
        sessionStorage.setItem('processAllQuotationsLastRun', now.toString())
      })
    }

    // Cleanup when component unmounts
    return () => {
      paymentMonitor.stopMonitoring()
    }
  }, [])

  // This component doesn't render anything, it just manages the monitoring
  return null
}
