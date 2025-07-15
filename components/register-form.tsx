"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"

const RegisterForm = () => {
  const [name, setName] = useState("")
  const [type, setType] = useState<"client" | "supplier">("client")
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [location, setLocation] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase.from("registered_entities").insert([
        {
          type,
          name,
          phone,
          pin,
          location,
        },
      ])

      if (error) {
        console.error("Error inserting data:", error)
      } else {
        console.log("Data inserted successfully:", data)
        // Reset form fields
        setName("")
        setPhone("")
        setPin("")
        setLocation("")
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New {type === "client" ? "Client" : "Supplier"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as "client" | "supplier")}
            >
              <option value="client">Client</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
              PIN Number
            </label>
            <Input type="text" id="pin" value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <Input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default RegisterForm
