"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import ModernProgressBar from './ModernProgressBar';

// Progress Context
interface ProgressContextType {
  startDownload: (fileName: string, fileType: 'pdf' | 'csv') => void;
  completeDownload: () => void;
  setError: (message?: string) => void;
  closeProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Global progress manager instance
let globalProgressManager: ProgressContextType | null = null;

// Progress Provider Component
export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progressState, setProgressState] = useState({
    isVisible: false,
    progress: 0,
    status: 'idle' as 'idle' | 'processing' | 'downloading' | 'completed' | 'error',
    fileName: '',
    fileType: 'pdf' as 'pdf' | 'csv'
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

  // Set the global instance immediately when functions are defined
  globalProgressManager = {
    startDownload,
    completeDownload,
    setError,
    closeProgress
  };
  
  // Also set it on the window object for global access
  if (typeof window !== 'undefined') {
    (window as any).__PROGRESS_MANAGER__ = globalProgressManager;
  }

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__PROGRESS_MANAGER__;
      }
      globalProgressManager = null;
    };
  }, []);

  const contextValue: ProgressContextType = {
    startDownload,
    completeDownload,
    setError,
    closeProgress
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
      
      {/* Global Progress Bar */}
      <div data-progress-manager="true">
        <ModernProgressBar
          isVisible={progressState.isVisible}
          progress={progressState.progress}
          status={progressState.status}
          fileName={progressState.fileName}
          fileType={progressState.fileType}
          onClose={closeProgress}
        />
      </div>
    </ProgressContext.Provider>
  );
};

// Custom Hook to use Progress Context
export const useGlobalProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useGlobalProgress must be used within a ProgressProvider');
  }
  return context;
};

// Export function to get the global progress manager instance
export const getGlobalProgressManager = () => globalProgressManager;


