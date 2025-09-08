'use client'

import { useState } from 'react'
import { paymentMonitor } from '@/lib/real-time-payment-monitor'
import { toast } from 'sonner'

export default function AdminUtilities() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
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

  const handleFixIncorrectlyConverted = async () => {
    setIsFixing(true)
    setProcessingStatus('Starting to fix incorrectly converted quotations...')
    
    try {
      // Add a small delay to show the status
      setTimeout(async () => {
        setProcessingStatus('Fixing quotations with incorrect conversion status...')
        await paymentMonitor.fixIncorrectlyConvertedQuotations()
        setProcessingStatus('Fix completed!')
        toast.success('Incorrectly converted quotations fixed successfully!')
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setProcessingStatus('')
          setIsFixing(false)
        }, 3000)
      }, 500)
    } catch (error) {
      console.error('Error fixing quotations:', error)
      toast.error('Failed to fix quotations')
      setProcessingStatus('')
      setIsFixing(false)
    }
  }

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true)
    setProcessingStatus('Starting to clean up duplicate sales orders...')
    
    try {
      // Add a small delay to show the status
      setTimeout(async () => {
        setProcessingStatus('Scanning for duplicate sales orders...')
        await paymentMonitor.cleanupAllDuplicateSalesOrders()
        setProcessingStatus('Cleanup completed!')
        toast.success('Duplicate sales orders cleaned up successfully!')
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setProcessingStatus('')
          setIsCleaning(false)
        }, 3000)
      }, 500)
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
      toast.error('Failed to clean up duplicates')
      setProcessingStatus('')
      setIsCleaning(false)
    }
  }

  return (
    <div className="admin-utilities p-3 border rounded bg-light">
      <h6 className="mb-3 text-primary">
        <i className="fas fa-tools me-2"></i>
        Admin Utilities
      </h6>
      
      <div className="mb-3">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-warning btn-sm"
            onClick={handleProcessAllQuotations}
            disabled={isProcessing || isFixing || isCleaning}
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
          
          <button
            className="btn btn-danger btn-sm"
            onClick={handleFixIncorrectlyConverted}
            disabled={isProcessing || isFixing || isCleaning}
          >
            {isFixing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Fixing...
              </>
            ) : (
              <>
                <i className="fas fa-wrench me-2"></i>
                Fix Incorrect Conversions
              </>
            )}
          </button>
          
          <button
            className="btn btn-info btn-sm"
            onClick={handleCleanupDuplicates}
            disabled={isProcessing || isFixing || isCleaning}
          >
            {isCleaning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cleaning...
              </>
            ) : (
              <>
                <i className="fas fa-broom me-2"></i>
                Clean Duplicates
              </>
            )}
          </button>
        </div>
      </div>
      
      {processingStatus && (
        <div className="alert alert-info alert-sm mb-2">
          <small>{processingStatus}</small>
        </div>
      )}
      
      <small className="d-block text-muted">
        <i className="fas fa-info-circle me-1"></i>
        Process All: Check existing quotations and create missing documents. Fix Incorrect: Fix quotations that were wrongly converted directly to cash_sale. Clean Duplicates: Remove duplicate sales orders from the same quotation.
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
