import React from 'react'

interface SectionHeaderProps {
  title: string
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  children,
  className = ""
}) => {
  return (
    <div className={`card-header ${className}`}>
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0">
          {icon && <span className="me-2">{icon}</span>}
          {title}
        </h2>
        {children && (
          <div className="d-flex gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  )
} 