import { useState, useCallback, useRef } from 'react';

export type DownloadStatus = 'idle' | 'processing' | 'downloading' | 'completed' | 'error';

interface ProgressState {
  isVisible: boolean;
  progress: number;
  status: DownloadStatus;
  fileName: string;
  fileType: 'pdf' | 'csv';
}

export const useProgressManager = () => {
  const [progressState, setProgressState] = useState<ProgressState>({
    isVisible: false,
    progress: 0,
    status: 'idle',
    fileName: '',
    fileType: 'pdf'
  });

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const startDownload = useCallback((fileName: string, fileType: 'pdf' | 'csv') => {
    // Clear any existing timeouts
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }

    setProgressState({
      isVisible: true,
      progress: 0,
      status: 'processing',
      fileName,
      fileType
    });

    // Simulate processing phase
    setTimeout(() => {
      setProgressState(prev => ({ ...prev, status: 'downloading' }));
      
      // Start progress animation
      let currentProgress = 0;
      progressInterval.current = setInterval(() => {
        currentProgress += Math.random() * 15 + 5; // Random increment between 5-20%
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          
          // Show completion
          setProgressState(prev => ({ ...prev, progress: 100, status: 'completed' }));
          
          // Auto-hide after 3 seconds
          closeTimeout.current = setTimeout(() => {
            setProgressState(prev => ({ ...prev, isVisible: false }));
          }, 3000);
        } else {
          setProgressState(prev => ({ ...prev, progress: currentProgress }));
        }
      }, 200);
    }, 800);
  }, []);

  const completeDownload = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setProgressState(prev => ({ ...prev, progress: 100, status: 'completed' }));
    
    // Auto-hide after 3 seconds
    closeTimeout.current = setTimeout(() => {
      setProgressState(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const setError = useCallback((errorMessage?: string) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setProgressState(prev => ({ ...prev, status: 'error' }));
    
    // Auto-hide after 5 seconds for errors
    closeTimeout.current = setTimeout(() => {
      setProgressState(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  const closeProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    
    setProgressState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const resetProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    
    setProgressState({
      isVisible: false,
      progress: 0,
      status: 'idle',
      fileName: '',
      fileType: 'pdf'
    });
  }, []);

  return {
    progressState,
    startDownload,
    completeDownload,
    setError,
    closeProgress,
    resetProgress
  };
};
