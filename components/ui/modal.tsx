import React from "react"
import { X } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default"
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === "destructive" ? "btn btn-danger" : "btn btn-primary"}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  showFooter?: boolean
  submitLoading?: boolean
  className?: string
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  showFooter = true,
  submitLoading = false,
  className
}) => {
  const handleCancel = () => {
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          
          {showFooter && (
            <DialogFooter>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={submitLoading}
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitLoading}
              >
                {submitLoading ? "Loading..." : confirmLabel}
              </button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DataTableModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
  columns: {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
  }[]
  onRowClick?: (row: any) => void
  className?: string
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  columns,
  onRowClick,
  className
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[600px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((column) => (
                  <th key={column.key} className="border border-gray-200 px-4 py-2 text-left">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="border border-gray-200 px-4 py-2">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <DialogFooter>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: { [key: string]: any }
  fields: {
    key: string
    label: string
    render?: (value: any) => React.ReactNode
  }[]
  className?: string
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  fields,
  className
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">{field.label}</label>
              <div className="text-sm text-gray-900">
                {field.render ? field.render(data[field.key]) : data[field.key] || "N/A"}
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MultiStepModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  children: React.ReactNode
  nextLabel?: string
  previousLabel?: string
  submitLabel?: string
  canProceed?: boolean
  isSubmitting?: boolean
  className?: string
}

export const MultiStepModal: React.FC<MultiStepModalProps> = ({
  isOpen,
  onClose,
  title,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSubmit,
  children,
  nextLabel = "Next",
  previousLabel = "Previous",
  submitLabel = "Submit",
  canProceed = true,
  isSubmitting = false,
  className
}) => {
  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="flex space-x-2 mt-2">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index + 1 <= currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </DialogHeader>
        
        <div className="py-4">{children}</div>
        
        <DialogFooter>
          {!isFirstStep && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onPrevious}
              disabled={isSubmitting}
            >
              {previousLabel}
            </button>
          )}
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          {isLastStep ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNext}
              disabled={!canProceed}
            >
              {nextLabel}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 