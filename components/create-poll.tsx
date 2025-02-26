"use client"

import { useState } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "./auth-provider"

interface CreatePollProps {
  onPollCreated: () => void
}

export default function CreatePoll({ onPollCreated }: CreatePollProps) {
  const [pollName, setPollName] = useState("")
  const [pollDays, setPollDays] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { user } = useAuth()

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const handleCreatePoll = async () => {
    if (!user) {
      setError("You must be logged in to create a poll")
      return
    }

    if (!pollName.trim()) {
      setError("Please enter a poll name")
      return
    }

    if (pollDays.length === 0) {
      setError("Please select at least one day for the poll")
      return
    }

    setError(null)
    setSuccess(null)

    try {
      console.log("Creating poll:", pollName)
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("SchedulePoll")
        .insert({
          name: pollName.trim(),
          user_id: user.id,
          days: pollDays.join(","),
        })
        .select()

      if (error) {
        console.error("Error creating poll:", error)
        setError("Failed to create poll. Please check the console for more details.")
      } else {
        console.log("Created poll:", data)
        setSuccess("Poll created successfully!")
        setPollName("")
        setPollDays([])
        onPollCreated()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Create New Poll</h2>
      <div className="space-y-4">
        <div>
          <Input
            type="text"
            value={pollName}
            onChange={(e) => setPollName(e.target.value)}
            placeholder="Enter poll name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select days for the poll:</label>
          <div className="flex flex-wrap gap-2">
            {allDays.map((day) => (
              <Button
                key={day}
                onClick={() =>
                  setPollDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
                }
                variant={pollDays.includes(day) ? "default" : "outline"}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={handleCreatePoll}>Create Poll</Button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  )
}

