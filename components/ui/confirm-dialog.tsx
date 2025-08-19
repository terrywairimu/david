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
      <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body pt-2">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ borderRadius: "12px", height: "45px" }}>
                {cancelText}
              </button>
              <button type="button" className={`btn ${getVariantClass()}`} onClick={onConfirm} style={{ borderRadius: "12px", height: "45px" }}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 