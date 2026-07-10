"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FolderKanban, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/ui/section-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatNumber } from "@/lib/format-number"
import { supabase } from "@/lib/supabase-client"
import {
  completeOngoingProject,
  DESKTOP_BATCH_SIZE,
  DESKTOP_PREFETCH_CARD_INDEX,
  fetchOngoingProjectsPage,
  filterOngoingProjects,
  MOBILE_BATCH_SIZE,
  MOBILE_PREFETCH_CARD_INDEX,
  type OngoingProject,
} from "@/lib/ongoing-projects-service"
import OngoingProjectCard from "./components/ongoing-project-card"

function getPrefetchTriggerIndex(prefetchCardIndex: number, loadedCount: number) {
  if (loadedCount === 0) return 0
  return Math.min(loadedCount - 1, prefetchCardIndex - 1)
}

export default function OngoingProjectsPage() {
  const isMobile = useIsMobile()
  const [projects, setProjects] = useState<OngoingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const projectsRef = useRef<OngoingProject[]>([])
  const hasMoreRef = useRef(false)

  const batchSize = isMobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE
  const prefetchCardIndex = isMobile ? MOBILE_PREFETCH_CARD_INDEX : DESKTOP_PREFETCH_CARD_INDEX

  const filteredProjects = useMemo(
    () => filterOngoingProjects(projects, searchTerm),
    [projects, searchTerm]
  )

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const loadProjects = useCallback(
    async (options?: { reset?: boolean; silent?: boolean }) => {
      const reset = options?.reset ?? false
      const silent = options?.silent ?? false

      if (loadingMoreRef.current) return
      loadingMoreRef.current = true

      try {
        if (reset) {
          if (!silent) setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const offset = reset ? 0 : projectsRef.current.length
        const result = await fetchOngoingProjectsPage(offset, batchSize)

        setTotalCount(result.totalCount)
        setHasMore(result.hasMore)
        setProjects((current) => {
          if (reset) return result.projects
          const existingIds = new Set(current.map((project) => project.id))
          const nextProjects = result.projects.filter((project) => !existingIds.has(project.id))
          return current.concat(nextProjects)
        })
      } catch (error) {
        console.error("Error loading ongoing projects:", error)
        toast.error("Failed to load ongoing projects")
      } finally {
        loadingMoreRef.current = false
        if (reset) {
          if (!silent) setLoading(false)
        } else {
          setLoadingMore(false)
        }
      }
    },
    [batchSize]
  )

  const refreshProjects = useCallback(
    async (options?: { silent?: boolean }) => {
      await loadProjects({ reset: true, silent: options?.silent })
    },
    [loadProjects]
  )

  useEffect(() => {
    void loadProjects({ reset: true })
  }, [loadProjects])

  useEffect(() => {
    if (!searchTerm.trim() || !hasMore || loading || loadingMore) return
    if (filteredProjects.length > 0) return

    void loadProjects({ reset: false, silent: true })
  }, [searchTerm, filteredProjects.length, hasMore, loading, loadingMore, loadProjects])

  useEffect(() => {
    if (searchTerm.trim()) return

    const triggerIndex = getPrefetchTriggerIndex(prefetchCardIndex, projects.length)
    const triggerNode = document.querySelector(`[data-ongoing-project-index="${triggerIndex}"]`)
    const observerTarget = triggerNode ?? loadMoreRef.current
    if (!observerTarget || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          void loadProjects({ reset: false })
        }
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.1 }
    )

    observer.observe(observerTarget)
    return () => observer.disconnect()
  }, [prefetchCardIndex, projects.length, hasMore, loadProjects, searchTerm])

  useEffect(() => {
    const channel = supabase
      .channel("ongoing_projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_orders" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_payments" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_payments" }, () => {
        void refreshProjects({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_entities" }, () => {
        void refreshProjects({ silent: true })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshProjects])

  const handleCompleteProject = async (salesOrderId: number) => {
    try {
      setCompletingId(salesOrderId)
      const result = await completeOngoingProject(salesOrderId)
      if (result.badDebtRecorded) {
        toast.success(`Project complete. Bad debt of KES ${formatNumber(result.badDebtAmount)} recorded.`)
      } else {
        toast.success("Project marked as complete")
      }
      setProjects((current) => current.filter((project) => project.salesOrderId !== salesOrderId))
      setTotalCount((count) => Math.max(0, count - 1))
    } catch (error) {
      console.error("Error completing project:", error)
      toast.error("Failed to complete project")
    } finally {
      setCompletingId(null)
    }
  }

  const showEmptyState = !loading && filteredProjects.length === 0
  const emptyMessage = useMemo(() => {
    if (searchTerm.trim()) {
      if (hasMore || loadingMore) {
        return "Searching more projects..."
      }
      return "No ongoing projects match your search."
    }
    return "No ongoing projects yet. A card appears once a quotation is converted to a sales order."
  }, [searchTerm, hasMore, loadingMore])

  return (
    <div id="ongoingProjectsSection" className="card">
      <SectionHeader title="Ongoing Projects" icon={<FolderKanban size={24} />}>
        <div className="ongoing-projects-search-wrap">
          <Search size={16} className="ongoing-projects-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search ongoing projects"
            className="ongoing-projects-search-input"
            aria-label="Search ongoing projects"
          />
        </div>
      </SectionHeader>
      <div className="card-body">
        {loading ? (
          <div className="ongoing-projects-loading">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Loading projects...</span>
          </div>
        ) : showEmptyState ? (
          <div className="ongoing-projects-empty">
            <FolderKanban size={40} className="text-muted-foreground mb-3" />
            <p className="mb-0">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className={`ongoing-projects-grid ${isMobile ? "ongoing-projects-grid-mobile" : "ongoing-projects-grid-scroll"}`}>
              {filteredProjects.map((project) => (
                <div key={project.id} data-ongoing-project-index={project.id}>
                  <OngoingProjectCard
                    project={project}
                    onComplete={handleCompleteProject}
                    isCompleting={completingId === project.salesOrderId}
                  />
                </div>
              ))}
            </div>

            {!searchTerm.trim() ? (
              <div ref={loadMoreRef} className="ongoing-projects-scroll-sentinel" aria-hidden="true" />
            ) : null}
            {loadingMore ? (
              <div className="ongoing-projects-loading-more">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>{searchTerm.trim() ? "Searching more projects..." : "Loading more projects..."}</span>
              </div>
            ) : null}
            {!searchTerm.trim() && !hasMore && projects.length > 0 ? (
              <p className="ongoing-projects-end-message mb-0">You&apos;ve reached the oldest project.</p>
            ) : null}
            {searchTerm.trim() && !hasMore && filteredProjects.length > 0 ? (
              <p className="ongoing-projects-end-message mb-0">End of search results.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
