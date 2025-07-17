"use client"

interface ConfirmDialogProps {
  show: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export default function ConfirmDialog({
  show,
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmDialogProps) {
  if (!show) return null

  const getVariantClass = () => {
    switch (variant) {
      case "danger":
        return "btn-danger"
      case "warning":
        return "btn-warning"
      case "info":
        return "btn-info"
      default:
        return "btn-danger"
    }
  }

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button type="button" className={`btn ${getVariantClass()}`} onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onCancel}></div>
    </>
  )
} 