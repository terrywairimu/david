"use client"

import { useCallback, useEffect, useState } from "react"
import { FolderKanban, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase } from "@/lib/supabase-client"
import {
  fetchOngoingProjects,
  type OngoingProject,
} from "@/lib/ongoing-projects-service"
import OngoingProjectCard from "./components/ongoing-project-card"

export default function OngoingProjectsPage() {
  const [projects, setProjects] = useState<OngoingProject[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchOngoingProjects()
      setProjects(data)
    } catch (error) {
      console.error("Error loading ongoing projects:", error)
      toast.error("Failed to load ongoing projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const channel = supabase
      .channel("ongoing_projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, loadProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "registered_entities" }, loadProjects)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadProjects])

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
            <p className="mb-0">No quotations yet. A project card appears when a quotation is created.</p>
          </div>
        ) : (
          <div className="ongoing-projects-grid">
            {projects.map((project) => (
              <OngoingProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
