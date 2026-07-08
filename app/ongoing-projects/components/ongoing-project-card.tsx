"use client"

import { formatNumber } from "@/lib/format-number"
import type { OngoingProject } from "@/lib/ongoing-projects-service"

interface OngoingProjectCardProps {
  project: OngoingProject
}

function formatKes(value: number) {
  return `KES ${formatNumber(value)}`
}

function ProjectRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="ongoing-project-row">
      <span className="ongoing-project-label">{label}</span>
      <span className={`ongoing-project-value ${valueClassName || ""}`.trim()}>{value}</span>
    </div>
  )
}

export default function OngoingProjectCard({ project }: OngoingProjectCardProps) {
  const isProfit = project.profitLoss >= 0
  const profitLossLabel = isProfit ? "Profit" : "Loss"
  const profitLossValue = formatKes(Math.abs(project.profitLoss))

  return (
    <article className="ongoing-project-card">
      <div className="ongoing-project-card-header">
        <h3 className="ongoing-project-card-title">{project.quotationNumber}</h3>
        {project.status ? (
          <span className="ongoing-project-status">{project.status.replace(/_/g, " ")}</span>
        ) : null}
      </div>
      <div className="ongoing-project-card-body">
        <ProjectRow label="Client" value={project.clientName} />
        <ProjectRow label="Location" value={project.projectLocation} />
        <ProjectRow label="Quote Amount" value={formatKes(project.quoteAmount)} />
        <ProjectRow label="Paid" value={formatKes(project.amountPaid)} />
        <ProjectRow label="Spent" value={formatKes(project.amountSpent)} />
        <ProjectRow
          label={profitLossLabel}
          value={profitLossValue}
          valueClassName={isProfit ? "ongoing-project-profit" : "ongoing-project-loss"}
        />
      </div>
    </article>
  )
}
