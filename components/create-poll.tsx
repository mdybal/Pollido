"use client"

import { useState } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "./auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreatePollProps {
  onPollCreated: () => void
}

export default function CreatePoll({ onPollCreated }: CreatePollProps) {
  const [pollName, setPollName] = useState("")
  const [pollType, setPollType] = useState<"schedule" | "calendar">("schedule")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { user } = useAuth()

  const handleCreatePoll = async () => {
    if (!user) {
      setError("You must be logged in to create a poll")
      return
    }

    if (!pollName.trim()) {
      setError("Please enter a poll name")
      return
    }

    if (pollType === "calendar" && (!startDate || !endDate)) {
      setError("Please enter both start and end dates for calendar poll")
      return
    }

    setError(null)
    setSuccess(null)

    try {
      console.log("Creating poll:", pollName)
      const supabase = createSupabaseClient()
      let data, error

      if (pollType === "schedule") {
        ;({ data, error } = await supabase
          .from("SchedulePoll")
          .insert({ name: pollName.trim(), user_id: user.id })
          .select())
      } else {
        ;({ data, error } = await supabase
          .from("CalendarPoll")
          .insert({ name: pollName.trim(), user_id: user.id, startDate, endDate })
          .select())
      }

      if (error) {
        console.error("Error creating poll:", error)
        setError("Failed to create poll. Please check the console for more details.")
      } else {
        console.log("Created poll:", data)
        setSuccess("Poll created successfully!")
        setPollName("")
        setStartDate("")
        setEndDate("")
        onPollCreated()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <h2 className="text-xl font-semibold mb-2">Create New Poll</h2>
      <div className="space-y-2">
        <Input
          type="text"
          value={pollName}
          onChange={(e) => setPollName(e.target.value)}
          placeholder="Enter poll name"
        />
        <Select onValueChange={(value: "schedule" | "calendar") => setPollType(value)} value={pollType}>
          <SelectTrigger>
            <SelectValue placeholder="Select poll type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schedule">Schedule Poll</SelectItem>
            <SelectItem value="calendar">Calendar Poll</SelectItem>
          </SelectContent>
        </Select>
        {pollType === "calendar" && (
          <>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End Date" />
          </>
        )}
        <Button onClick={handleCreatePoll}>Create Poll</Button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  )
}

