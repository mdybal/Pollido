"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "../utils/supabase"
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
  refreshTrigger: number
  onPollsLoaded: (polls: Poll[]) => void
}

export default function PollSelector({ onSelectPoll, refreshTrigger, onPollsLoaded }: PollSelectorProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPolls()
    }
  }, [user]) // Removed refreshTrigger from dependencies

  const fetchPolls = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Fetching polls...")
      const supabase = createSupabaseClient()

      // First, check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("PublicUserProfile")
        .select("role")
        .eq("uid", user.id)
        .single()

      if (adminError) throw adminError

      const isAdmin = adminData?.role === "admin"

      let allPolls: Poll[] = []

      if (isAdmin) {
        // Fetch all polls for admin users
        const { data: schedulePolls, error: scheduleError } = await supabase
          .from("SchedulePoll")
          .select("id, name, description, ownerUser")

        const { data: calendarPolls, error: calendarError } = await supabase
          .from("CalendarPoll")
          .select("id, name, description, ownerUser")

        if (scheduleError) throw scheduleError
        if (calendarError) throw calendarError

        allPolls = [
          ...(schedulePolls || []).map((poll) => ({ ...poll, type: "schedule" as const })),
          ...(calendarPolls || []).map((poll) => ({ ...poll, type: "calendar" as const })),
        ]
      } else {
        // For non-admin users, fetch polls where user is owner and polls where user is a member
        const { data: pollMemberData, error: pollMemberError } = await supabase
          .from("PollMember")
          .select("PollID")
          .eq("userID", user.id)

        if (pollMemberError) throw pollMemberError

        const pollMemberIds = pollMemberData.map((pm) => pm.PollID)

        const { data: ownedSchedulePolls, error: ownedScheduleError } = await supabase
          .from("SchedulePoll")
          .select("id, name, description, ownerUser")
          .eq("ownerUser", user.id)

        const { data: ownedCalendarPolls, error: ownedCalendarError } = await supabase
          .from("CalendarPoll")
          .select("id, name, description, ownerUser")
          .eq("ownerUser", user.id)

        const { data: memberCalendarPolls, error: memberCalendarError } = await supabase
          .from("CalendarPoll")
          .select("id, name, description, ownerUser")
          .in("id", pollMemberIds)

        const { data: memberSchedulePolls, error: memberScheduleError } = await supabase
          .from("SchedulePoll")
          .select("id, name, description, ownerUser")
          .in("id", pollMemberIds)

        if (ownedScheduleError) throw ownedScheduleError
        if (ownedCalendarError) throw ownedCalendarError
        if (memberCalendarError) throw memberCalendarError
        if (memberScheduleError) throw memberScheduleError

        allPolls = [
          ...(ownedSchedulePolls || []).map((poll) => ({ ...poll, type: "schedule" as const })),
          ...(ownedCalendarPolls || []).map((poll) => ({ ...poll, type: "calendar" as const })),
          ...(memberCalendarPolls || []).map((poll) => ({ ...poll, type: "calendar" as const })),
          ...(memberSchedulePolls || []).map((poll) => ({ ...poll, type: "schedule" as const })),
        ]
      }

      // Filter out any undefined or incomplete poll entries
      const validPolls = allPolls.filter(
        (poll): poll is Poll =>
          poll !== undefined && poll.id !== undefined && poll.name !== undefined && poll.type !== undefined,
      )

      // Remove duplicates and sort polls
      const uniquePolls = Array.from(new Set(validPolls.map((poll) => poll.id)))
        .map((id) => validPolls.find((poll) => poll.id === id))
        .filter((poll): poll is Poll => poll !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name))

      console.log("Fetched polls:", uniquePolls)
      if (uniquePolls.length > 0) {
        setPolls(uniquePolls)
        onPollsLoaded(uniquePolls)
      } else {
        setError("No polls found. Make sure you have created some polls or have been invited to participate.")
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
    if (selected) {
      onSelectPoll(selected.id, selected.type)
    }
  }

  if (isLoading) {
    return <div>Loading polls...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (polls.length === 0) {
    return <div>No polls available. Please create a new poll or wait for an invitation.</div>
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
    </div>
  )
}

