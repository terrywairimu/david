"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, FolderKanban, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase } from "@/lib/supabase-client"
import {
  completeOngoingProject,
  fetchOngoingProjects,
  type OngoingProject,
} from "@/lib/ongoing-projects-service"
import OngoingProjectCard from "./components/ongoing-project-card"

const ITEMS_PER_PAGE = 6

export default function OngoingProjectsPage() {
  const [projects, setProjects] = useState<OngoingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [completingId, setCompletingId] = useState<number | null>(null)

  const loadProjects = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true)
      }
      const data = await fetchOngoingProjects()
      setProjects(data)
    } catch (error) {
      console.error("Error loading ongoing projects:", error)
      toast.error("Failed to load ongoing projects")
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE))

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return projects.slice(start, start + ITEMS_PER_PAGE)
  }, [projects, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const channel = supabase
      .channel("ongoing_projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_orders" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_entities" }, loadProjects)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadProjects])

  const handleCompleteProject = async (quotationId: number, salesOrderId?: number | null) => {
    try {
      setCompletingId(salesOrderId ?? quotationId)
      await completeOngoingProject(quotationId, salesOrderId)
      toast.success("Project marked as complete")
      await loadProjects({ silent: true })
    } catch (error) {
      console.error("Error completing project:", error)
      toast.error("Failed to complete project")
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <div id="ongoingProjectsSection" className="card">
      <SectionHeader title="Ongoing Projects" icon={<FolderKanban size={24} />} />
      <div className="card-body">
        {loading ? (
          <div className="ongoing-projects-loading">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="ongoing-projects-empty">
            <FolderKanban size={40} className="text-muted-foreground mb-3" />
            <p className="mb-0">No ongoing projects yet. A card appears once a quotation is converted to a sales order.</p>
          </div>
        ) : (
          <>
            <div className="ongoing-projects-grid">
              {paginatedProjects.map((project) => (
                <OngoingProjectCard
                  key={project.id}
                  project={project}
                  onComplete={handleCompleteProject}
                  isCompleting={completingId === project.salesOrderId}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="ongoing-projects-pagination">
                <button
                  type="button"
                  className="ongoing-projects-page-btn"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="ongoing-projects-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="ongoing-projects-page-btn"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
