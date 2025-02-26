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
}

interface PollSelectorProps {
  onSelectPoll: (pollId: string) => void
}

export default function PollSelector({ onSelectPoll }: PollSelectorProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
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
      const { data, error } = await supabase.from("SchedulePoll").select("id, name, description").order("name")

      if (error) {
        console.error("Error fetching polls:", error)
        setError("Failed to fetch polls. Please check the console for more details.")
      } else {
        console.log("Fetched polls:", data)
        if (data && data.length > 0) {
          setPolls(data)
        } else {
          setError("No polls found. Make sure you have created some polls in the SchedulePoll table.")
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPoll = (pollId: string) => {
    setSelectedPollId(pollId)
  }

  const handleViewPoll = () => {
    if (selectedPollId) {
      onSelectPoll(selectedPollId)
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
      <Select onValueChange={handleSelectPoll} value={selectedPollId || undefined}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a poll" />
        </SelectTrigger>
        <SelectContent>
          {polls.map((poll) => (
            <SelectItem key={poll.id} value={poll.id}>
              {poll.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleViewPoll} disabled={!selectedPollId}>
        View
      </Button>
    </div>
  )
}

