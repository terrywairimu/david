// Progress Enhanced Export Functions
// This file provides enhanced export functions with modern progress tracking

import { toast } from 'sonner';

// Enhanced export function wrapper
export const createProgressEnhancedExport = (
  exportFunction: Function,
  progressManager: {
    startDownload: (fileName: string, fileType: 'pdf' | 'csv') => void;
    completeDownload: () => void;
    setError: (message?: string) => void;
  }
) => {
  return async (data: any, format: 'pdf' | 'csv', customFileName?: string) => {
    try {
      // Generate filename
      const fileName = customFileName || `export_${new Date().toISOString().split('T')[0]}`;
      
      // Start progress tracking
      progressManager.startDownload(fileName, format);
      
      // Execute the actual export
      const result = await exportFunction(data, format);
      
      // Complete progress
      progressManager.completeDownload();
      
      // Show success message
      toast.success(`${format.toUpperCase()} export completed successfully!`);
      
      return result;
    } catch (error) {
      console.error('Export error:', error);
      
      // Set error state
      progressManager.setError('Export failed');
      
      // Show error message
      toast.error(`Failed to export ${format.toUpperCase()}`);
      
      throw error;
    }
  };
};

// Enhanced single payment export
export const createProgressEnhancedPaymentExport = (
  progressManager: {
    startDownload: (fileName: string, fileType: 'pdf' | 'csv') => void;
    completeDownload: () => void;
    setError: (message?: string) => void;
  }
) => {
  return async (payment: any) => {
    try {
      const fileName = `payment_${payment.payment_number}_receipt`;
      
      // Start progress tracking
      progressManager.startDownload(fileName, 'pdf');
      
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Complete progress
      progressManager.completeDownload();
      
      return true;
    } catch (error) {
      console.error('Payment export error:', error);
      progressManager.setError('Payment receipt generation failed');
      throw error;
    }
  };
};

// Progress simulation for better user experience
export const simulateProgress = (
  progressManager: {
    startDownload: (fileName: string, fileType: 'pdf' | 'csv') => void;
    completeDownload: () => void;
    setError: (message?: string) => void;
  },
  fileName: string,
  fileType: 'pdf' | 'csv',
  duration: number = 2000
) => {
  return new Promise<void>((resolve) => {
    progressManager.startDownload(fileName, fileType);
    
    setTimeout(() => {
      progressManager.completeDownload();
      resolve();
    }, duration);
  });
};

// Export progress states
export const EXPORT_STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export type ExportState = typeof EXPORT_STATES[keyof typeof EXPORT_STATES];
