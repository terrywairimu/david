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
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const projectsRef = useRef<OngoingProject[]>([])

  const batchSize = isMobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE
  const prefetchCardIndex = isMobile ? MOBILE_PREFETCH_CARD_INDEX : DESKTOP_PREFETCH_CARD_INDEX

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadProjects = useCallback(
    async (options?: { reset?: boolean; silent?: boolean; query?: string }) => {
      const reset = options?.reset ?? false
      const silent = options?.silent ?? false
      const query = options?.query ?? searchQuery

      if (loadingMoreRef.current) return
      loadingMoreRef.current = true

      try {
        if (reset) {
          if (!silent) setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const offset = reset ? 0 : projectsRef.current.length
        const result = await fetchOngoingProjectsPage(offset, batchSize, query)

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
    [batchSize, searchQuery]
  )

  const refreshProjects = useCallback(
    async (options?: { silent?: boolean }) => {
      await loadProjects({ reset: true, silent: options?.silent, query: searchQuery })
    },
    [loadProjects, searchQuery]
  )

  useEffect(() => {
    void loadProjects({ reset: true, query: searchQuery })
  }, [loadProjects, searchQuery])

  useEffect(() => {
    const triggerIndex = getPrefetchTriggerIndex(prefetchCardIndex, projects.length)
    const triggerNode = document.querySelector(`[data-ongoing-project-index="${triggerIndex}"]`)
    const observerTarget = triggerNode ?? loadMoreRef.current
    if (!observerTarget || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasMore && !loadingMoreRef.current) {
          void loadProjects({ reset: false, query: searchQuery })
        }
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.1 }
    )

    observer.observe(observerTarget)
    return () => observer.disconnect()
  }, [prefetchCardIndex, projects.length, hasMore, loadProjects, searchQuery])

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

  const showEmptyState = !loading && projects.length === 0
  const emptyMessage = useMemo(() => {
    if (searchQuery) {
      return "No ongoing projects match your search."
    }
    return "No ongoing projects yet. A card appears once a quotation is converted to a sales order."
  }, [searchQuery])

  return (
    <div id="ongoingProjectsSection" className="card">
      <SectionHeader title="Ongoing Projects" icon={<FolderKanban size={24} />}>
        <div className="ongoing-projects-search-wrap">
          <Search size={16} className="ongoing-projects-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
              {projects.map((project, index) => (
                <div key={project.id} data-ongoing-project-index={index}>
                  <OngoingProjectCard
                    project={project}
                    onComplete={handleCompleteProject}
                    isCompleting={completingId === project.salesOrderId}
                  />
                </div>
              ))}
            </div>

            <div ref={loadMoreRef} className="ongoing-projects-scroll-sentinel" aria-hidden="true" />
            {loadingMore ? (
              <div className="ongoing-projects-loading-more">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading more projects...</span>
              </div>
            ) : null}
            {!hasMore && projects.length > 0 ? (
              <p className="ongoing-projects-end-message mb-0">
                {searchQuery ? "End of search results." : "You've reached the oldest project."}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
