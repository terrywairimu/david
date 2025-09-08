'use client'

import { useState } from 'react'
import { paymentMonitor } from '@/lib/real-time-payment-monitor'
import { toast } from 'sonner'

export default function AdminUtilities() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')

  const handleProcessAllQuotations = async () => {
    setIsProcessing(true)
    setProcessingStatus('Starting to process quotations...')
    
    try {
      // Add a small delay to show the status
      setTimeout(async () => {
        setProcessingStatus('Checking quotations with payments...')
        await paymentMonitor.processAllQuotations()
        setProcessingStatus('Processing completed!')
        toast.success('All quotations processed successfully!')
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setProcessingStatus('')
          setIsProcessing(false)
        }, 3000)
      }, 500)
    } catch (error) {
      console.error('Error processing quotations:', error)
      toast.error('Failed to process quotations')
      setProcessingStatus('')
      setIsProcessing(false)
    }
  }

  return (
    <div className="admin-utilities p-3 border rounded bg-light">
      <h6 className="mb-3 text-primary">
        <i className="fas fa-tools me-2"></i>
        Admin Utilities
      </h6>
      
      <div className="mb-3">
        <button
          className="btn btn-warning btn-sm"
          onClick={handleProcessAllQuotations}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt me-2"></i>
              Process All Quotations
            </>
          )}
        </button>
      </div>
      
      {processingStatus && (
        <div className="alert alert-info alert-sm mb-2">
          <small>{processingStatus}</small>
        </div>
      )}
      
      <small className="d-block text-muted">
        <i className="fas fa-info-circle me-1"></i>
        This will check all existing quotations and create missing invoices/cash sales based on payment status
      </small>
      
      <div className="mt-2">
        <small className="text-muted">
          <strong>Conversion Rules:</strong><br/>
          • Quotation → Sales Order (any payment)<br/>
          • Sales Order → Invoice (75% payment)<br/>
          • Sales Order → Cash Sale (100% payment)<br/>
          • Invoice → Cash Sale (100% payment)
        </small>
      </div>
    </div>
  )
}
