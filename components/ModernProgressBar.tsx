"use client"

import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, FileText, AlertCircle, X } from 'lucide-react';

interface ProgressBarProps {
  isVisible: boolean;
  progress: number;
  status: 'idle' | 'downloading' | 'processing' | 'completed' | 'error';
  fileName: string;
  fileType: 'pdf' | 'csv';
  onClose: () => void;
}

const ModernProgressBar: React.FC<ProgressBarProps> = ({
  isVisible,
  progress,
  status,
  fileName,
  fileType,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'downloading':
        return <Download className="w-5 h-5 animate-pulse" />;
      case 'processing':
        return <FileText className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'from-gray-500 to-gray-400';
      case 'downloading':
        return 'from-blue-500 to-cyan-500';
      case 'processing':
        return 'from-purple-500 to-pink-500';
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Preparing...';
      case 'downloading':
        return 'Downloading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Download Complete!';
      case 'error':
        return 'Download Failed';
      default:
        return 'Preparing...';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      {/* Glassmorphism Container */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/5" />
        
        {/* Main Content */}
        <div className="relative p-6 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${getStatusColor()} bg-opacity-10`}>
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {getStatusText()}
                </h3>
                <p className="text-xs text-gray-600">
                  {fileName}.{fileType.toUpperCase()}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            {/* Modern Progress Bar */}
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full" />
              
              {/* Progress Fill with Gradient */}
              <div
                className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              >
                {/* Animated Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              
              {/* Glow Effect */}
              <div
                className={`absolute top-0 h-full w-1 bg-white/60 rounded-full blur-sm transition-all duration-500 ease-out`}
                style={{ 
                  left: `${progress}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
          </div>

          {/* Status Details */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {status === 'completed' ? 'File ready' : status === 'idle' ? 'Initializing...' : 'Please wait...'}
            </span>
            
            {/* File Type Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              fileType === 'pdf' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {fileType.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className={`h-1 bg-gradient-to-r ${getStatusColor()}`} />
      </div>
    </div>
  );
};

export default ModernProgressBar;
