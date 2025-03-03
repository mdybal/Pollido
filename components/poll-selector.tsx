"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "./auth-provider"

interface Poll {
  id: string
  name: string
  description?: string
  type: "schedule" | "calendar"
}

interface PollSelectorProps {
  onSelectPoll: (pollId: string, pollType: "schedule" | "calendar") => void
}

export default function PollSelector({ onSelectPoll }: PollSelectorProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPolls()
    }
  }, [user])

  const fetchPolls = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching polls...")
      const supabase = createSupabaseClient()

      const [scheduleResult, calendarResult] = await Promise.all([
        supabase.from("SchedulePoll").select("id, name, description"),
        supabase.from("CalendarPoll").select("id, name, description"),
      ])

      if (scheduleResult.error) throw scheduleResult.error
      if (calendarResult.error) throw calendarResult.error

      const schedulePolls = (scheduleResult.data || []).map((poll:any) => ({ ...poll, type: "schedule" as const }))
      const calendarPolls = (calendarResult.data || []).map((poll:any) => ({ ...poll, type: "calendar" as const }))

      const allPolls = [...schedulePolls, ...calendarPolls].sort((a, b) => a.name.localeCompare(b.name))

      console.log("Fetched polls:", allPolls)
      if (allPolls.length > 0) {
        setPolls(allPolls)
      } else {
        setError("No polls found. Make sure you have created some polls in the SchedulePoll or CalendarPoll tables.")
      }
    } catch (err) {
      console.error("Error fetching polls:", err)
      setError("Failed to fetch polls. Please check the console for more details.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPoll = (pollId: string) => {
    const selected = polls.find((poll) => poll.id === pollId)
    setSelectedPoll(selected || null)
  }

  const handleViewPoll = () => {
    if (selectedPoll) {
      onSelectPoll(selectedPoll.id, selectedPoll.type)
    }
  }

  if (isLoading) {
    return <div>Loading polls...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (polls.length === 0) {
    return <div>No polls available. Please create a new poll.</div>
  }

  return (
    <div className="flex items-center space-x-4">
      <Select onValueChange={handleSelectPoll} value={selectedPoll?.id}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a poll" />
        </SelectTrigger>
        <SelectContent>
          {polls.map((poll) => (
            <SelectItem key={poll.id} value={poll.id}>
              {poll.name} ({poll.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleViewPoll} disabled={!selectedPoll}>
        View
      </Button>
    </div>
  )
}

