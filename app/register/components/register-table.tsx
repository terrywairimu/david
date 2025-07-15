"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase-client"

interface RegisteredEntity {
  id: number
  type: "client" | "supplier"
  name: string
  phone: string
  pin?: string
  location: string
  date_added: string
}

const RegisterTable = () => {
  const [registeredEntities, setRegisteredEntities] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegisteredEntities = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("registered_entities")
          .select("*")
          .order("date_added", { ascending: false })

        if (error) {
          console.error("Error fetching registered entities:", error)
        } else {
          setRegisteredEntities(data || [])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRegisteredEntities()
  }, [])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>PIN Number</TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7}>Loading...</TableCell>
          </TableRow>
        ) : (
          registeredEntities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell>{entity.name}</TableCell>
              <TableCell>{entity.type}</TableCell>
              <TableCell>{entity.phone}</TableCell>
              <TableCell>{entity.location}</TableCell>
              <TableCell>{entity.pin || "-"}</TableCell>
              <TableCell>{new Date(entity.date_added).toLocaleDateString()}</TableCell>
              <TableCell>{/* Add action buttons here */}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default RegisterTable
