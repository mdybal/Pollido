"use client"

import { useState } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "./auth-provider"
import { Label } from "@/components/ui/label"

interface CreatePollProps {
  pollType: "schedule" | "calendar"
  onPollCreated: () => void
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function CreatePoll({ pollType, onPollCreated }: CreatePollProps) {
  const [pollName, setPollName] = useState("")
  const [pollDescription, setPollDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
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

    if (pollType === "schedule" && selectedDays.length === 0) {
      setError("Please select at least one day for schedule poll")
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
          .insert({
            name: pollName.trim(),
            description: pollDescription.trim(),
            ownerUser: user.id,
            days: selectedDays.join(","),
          })
          .select())
      } else {
        ;({ data, error } = await supabase
          .from("CalendarPoll")
          .insert({
            name: pollName.trim(),
            description: pollDescription.trim(),
            ownerUser: user.id,
            startDate,
            endDate,
          })
          .select())
      }

      if (error) {
        console.error("Error creating poll:", error)
        setError("Failed to create poll. Please check the console for more details.")
      } else {
        console.log("Created poll:", data)
        setSuccess("Poll created successfully!")
        setPollName("")
        setPollDescription("")
        setStartDate("")
        setEndDate("")
        setSelectedDays([])
        onPollCreated()
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="pollName">Poll Name</Label>
        <Input
          id="pollName"
          type="text"
          value={pollName}
          onChange={(e) => setPollName(e.target.value)}
          placeholder="Enter poll name"
        />
      </div>
      <div>
        <Label htmlFor="pollDescription">Description</Label>
        <Textarea
          id="pollDescription"
          value={pollDescription}
          onChange={(e) => setPollDescription(e.target.value)}
          placeholder="Enter poll description"
        />
      </div>
      {pollType === "calendar" ? (
        <>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </>
      ) : (
        <div>
          <Label>Days</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center">
                <Checkbox id={day} checked={selectedDays.includes(day)} onCheckedChange={() => handleDayToggle(day)} />
                <label
                  htmlFor={day}
                  className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button onClick={handleCreatePoll}>Create Poll</Button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  )
}

