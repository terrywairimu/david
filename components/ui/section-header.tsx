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
  // For mobile: count valid button children for dynamic width
  const validChildren = React.Children.toArray(children).filter(child => React.isValidElement(child));
  const btnCount = validChildren.length || 1;
  const btnWidth = `${100 / btnCount}%`;

  return (
    <div className={`card-header border-0 bg-white section-header-responsive ${className}`}>
      {/* Desktop Layout: Title on left, buttons on right */}
      <div className="d-none d-md-flex justify-content-between align-items-center">
        {/* Title Section - Left side on desktop */}
        <div className="d-flex align-items-center section-header-title-desktop">
          {icon && (
            <div className="me-4 text-white" style={{ fontSize: '1.5rem' }}>
              {icon}
            </div>
          )}
          <h2 className="mb-0 fs-3 fw-bold text-white section-header-title-responsive" style={{ fontSize: '1.75rem', fontWeight: '700' }}>
            {title}
          </h2>
        </div>
        
        {/* Actions Section - Right side on desktop */}
        {children && (
          <div className="d-flex flex-wrap gap-2 section-header-actions-desktop">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                const element = child as React.ReactElement<any>;
                return React.cloneElement(element, {
                  className: `${element.props.className || ''} btn-sm section-header-btn-responsive`.trim(),
                  style: {
                    ...element.props.style,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    minHeight: '38px',
                  }
                })
              }
              return child
            })}
          </div>
        )}
      </div>

      {/* Mobile Layout: Title at top, buttons below with equal spacing */}
      <div className="d-flex d-md-none flex-column">
        {/* Title Section - Top on mobile */}
        <div className="d-flex align-items-center mb-3">
          {icon && (
            <div className="me-3 text-primary">
              {icon}
            </div>
          )}
          <h2 className="mb-0 fs-5 fw-bold text-dark section-header-title-responsive">
            {title}
          </h2>
        </div>
        
        {/* Actions Section - Below title on mobile with dynamic width */}
        {children && (
          <div className="section-header-actions-mobile" style={{ display: 'flex', flexWrap: 'nowrap', width: '100%', gap: '2px' }}>
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                const element = child as React.ReactElement<any>;
                return React.cloneElement(element, {
                  className: `${element.props.className || ''} btn-sm section-header-btn-mobile`.trim(),
                  style: {
                    ...element.props.style,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    minHeight: '32px',
                    flex: '1 1 0',
                    margin: '0',
                    minWidth: 0,
                    maxWidth: btnWidth,
                    flexBasis: btnWidth,
                  }
                })
              }
              return child
            })}
          </div>
        )}
      </div>
    </div>
  )
} 