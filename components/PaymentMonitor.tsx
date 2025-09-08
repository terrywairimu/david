'use client'

import { useEffect } from 'react'
import { paymentMonitor } from '@/lib/real-time-payment-monitor'

export default function PaymentMonitor() {
  useEffect(() => {
    // Start real-time payment monitoring when component mounts
    paymentMonitor.startMonitoring()
    
    // Clean up duplicate sales orders first
    paymentMonitor.cleanupAllDuplicateSalesOrders()
    
    // Fix incorrectly converted quotations
    paymentMonitor.fixIncorrectlyConvertedQuotations()
    
    // Then process all existing quotations to catch up on missed conversions
    paymentMonitor.processAllQuotations()

    // Cleanup when component unmounts
    return () => {
      paymentMonitor.stopMonitoring()
    }
  }, [])

  // This component doesn't render anything, it just manages the monitoring
  return null
}
