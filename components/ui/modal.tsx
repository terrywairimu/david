import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel 
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// Base Modal Types
export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  className?: string
  children: React.ReactNode
}

export interface FormModalProps extends BaseModalProps {
  onSubmit?: (e: React.FormEvent) => void
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
  submitLoading?: boolean
  showFooter?: boolean
  onCancel?: () => void
}

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  loading?: boolean
}

export interface DocumentModalProps extends BaseModalProps {
  showPrintButton?: boolean
  onPrint?: () => void
  showDownloadButton?: boolean
  onDownload?: () => void
  showActions?: boolean
  actions?: React.ReactNode
}

// Size class mapping
const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw] w-full h-[95vh]"
}

// Base Modal Component
const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  className,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Form Modal Component
const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  size = "md",
  className,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  submitDisabled = false,
  submitLoading = false,
  showFooter = true,
  onCancel,
  children
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          
          {showFooter && (
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={submitLoading}
              >
                {cancelLabel}
              </Button>
              <Button 
                type="submit" 
                disabled={submitDisabled || submitLoading}
              >
                {submitLoading ? "Loading..." : submitLabel}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Confirmation Modal Component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "destructive" && "bg-red-600 hover:bg-red-700"
            )}
          >
            {loading ? "Loading..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Document Modal Component (for A4 documents, quotations, invoices)
const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "2xl",
  className,
  showPrintButton = false,
  onPrint,
  showDownloadButton = false,
  onDownload,
  showActions = false,
  actions,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], "document-modal", className)}>
        {(title || description) && (
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && <DialogDescription>{description}</DialogDescription>}
              </div>
              <div className="flex items-center space-x-2">
                {showPrintButton && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onPrint}
                  >
                    Print
                  </Button>
                )}
                {showDownloadButton && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onDownload}
                  >
                    Download
                  </Button>
                )}
                {showActions && actions}
              </div>
            </div>
          </DialogHeader>
        )}
        
        <div className="document-content overflow-auto max-h-[70vh]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Fullscreen Modal Component (for A4 documents)
const FullscreenModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  className,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-[100vw] w-full h-[100vh] m-0 p-0",
        "fullscreen-modal",
        className
      )}>
        {(title || description) && (
          <DialogHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && <DialogDescription>{description}</DialogDescription>}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        )}
        
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// View Modal Component (for read-only views)
const ViewModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "lg",
  className,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        <div className="space-y-4">
          {children}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Multi-step Modal Component
export interface MultiStepModalProps extends BaseModalProps {
  steps: {
    title: string
    content: React.ReactNode
    isValid?: boolean
  }[]
  currentStep: number
  onNext: () => void
  onPrevious: () => void
  onSubmit?: () => void
  nextLabel?: string
  previousLabel?: string
  submitLabel?: string
  loading?: boolean
}

const MultiStepModal: React.FC<MultiStepModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "lg",
  className,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSubmit,
  nextLabel = "Next",
  previousLabel = "Previous",
  submitLabel = "Submit",
  loading = false
}) => {
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0
  const currentStepData = steps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                index === currentStep
                  ? "bg-blue-600 text-white"
                  : index < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Step Title */}
        <h3 className="text-lg font-semibold mb-4">{currentStepData.title}</h3>
        
        {/* Step Content */}
        <div className="space-y-4">
          {currentStepData.content}
        </div>
        
        {/* Navigation */}
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstStep || loading}
            >
              {previousLabel}
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              
              {isLastStep ? (
                <Button
                  onClick={onSubmit}
                  disabled={!currentStepData.isValid || loading}
                >
                  {loading ? "Loading..." : submitLabel}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  disabled={!currentStepData.isValid || loading}
                >
                  {nextLabel}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Modal Hook for managing modal state
export interface ModalState {
  isOpen: boolean
  type?: "create" | "edit" | "view" | "delete"
  data?: any
  title?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const useModal = (initialState: ModalState = { isOpen: false }) => {
  const [modalState, setModalState] = React.useState<ModalState>(initialState)

  const openModal = (
    type: "create" | "edit" | "view" | "delete",
    data?: any,
    title?: string,
    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  ) => {
    setModalState({
      isOpen: true,
      type,
      data,
      title,
      size
    })
  }

  const closeModal = () => {
    setModalState({ isOpen: false })
  }

  const updateModal = (updates: Partial<ModalState>) => {
    setModalState(prev => ({ ...prev, ...updates }))
  }

  return {
    modalState,
    openModal,
    closeModal,
    updateModal
  }
}

// Export all components
export {
  BaseModal,
  FormModal,
  ConfirmationModal,
  DocumentModal,
  FullscreenModal,
  ViewModal,
  MultiStepModal,
  useModal
} 