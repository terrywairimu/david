'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function AdminUtilities() {
  const [isCleaning, setIsCleaning] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true)
    setProcessingStatus('Starting to clean up duplicate cash sales...')
    
    try {
      // Add a small delay to show the status
      setTimeout(async () => {
        setProcessingStatus('Scanning for duplicate cash sales...')
        
        // Call the cleanup API
        const response = await fetch('/api/cleanup-duplicates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          setProcessingStatus(`Cleanup completed! Removed ${result.deletedCount} duplicate records.`)
          toast.success(`Duplicate cash sales cleaned up successfully! Removed ${result.deletedCount} duplicates.`)
        } else {
          throw new Error('Cleanup failed')
        }
        
        // Reset status after 5 seconds
        setTimeout(() => {
          setProcessingStatus('')
          setIsCleaning(false)
        }, 5000)
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
            className="btn btn-info btn-sm"
            onClick={handleCleanupDuplicates}
            disabled={isCleaning}
          >
            {isCleaning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cleaning...
              </>
            ) : (
              <>
                <i className="fas fa-broom me-2"></i>
                Clean Duplicate Cash Sales
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
        Clean Duplicates: Remove duplicate cash sales records, keeping only the original ones.
      </small>
    </div>
  )
}
