"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FolderKanban, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/ui/section-header"
import { useIsMobile } from "@/hooks/use-mobile"
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const projectsRef = useRef<OngoingProject[]>([])

  const batchSize = isMobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE
  const prefetchCardIndex = isMobile ? MOBILE_PREFETCH_CARD_INDEX : DESKTOP_PREFETCH_CARD_INDEX

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

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
    const triggerIndex = getPrefetchTriggerIndex(prefetchCardIndex, projects.length)
    const triggerNode = document.querySelector(`[data-ongoing-project-index="${triggerIndex}"]`)
    const observerTarget = triggerNode ?? loadMoreRef.current
    if (!observerTarget || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasMore && !loadingMoreRef.current) {
          void loadProjects({ reset: false })
        }
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.1 }
    )

    observer.observe(observerTarget)
    return () => observer.disconnect()
  }, [batchSize, prefetchCardIndex, projects.length, hasMore, loadProjects])

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
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_entities" }, () => {
        void refreshProjects({ silent: true })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshProjects])

  const handleCompleteProject = async (quotationId: number, salesOrderId?: number | null) => {
    try {
      setCompletingId(salesOrderId ?? quotationId)
      await completeOngoingProject(quotationId, salesOrderId)
      toast.success("Project marked as complete")
      await refreshProjects({ silent: true })
    } catch (error) {
      console.error("Error completing project:", error)
      toast.error("Failed to complete project")
    } finally {
      setCompletingId(null)
    }
  }

  const showEmptyState = !loading && totalCount === 0

  return (
    <div id="ongoingProjectsSection" className="card">
      <SectionHeader title="Ongoing Projects" icon={<FolderKanban size={24} />} />
      <div className="card-body">
        {loading ? (
          <div className="ongoing-projects-loading">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Loading projects...</span>
          </div>
        ) : showEmptyState ? (
          <div className="ongoing-projects-empty">
            <FolderKanban size={40} className="text-muted-foreground mb-3" />
            <p className="mb-0">
              No ongoing projects yet. A card appears once a quotation is converted to a sales order.
            </p>
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
              <p className="ongoing-projects-end-message mb-0">You&apos;ve reached the oldest project.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
