"use client"

import { useState, useEffect, useMemo } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { useAuth } from "./auth-provider"
import CalendarView from "./calendar-view"
import { format, parseISO } from "date-fns"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import PollSettings from "./poll-settings"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CalendarPollProps {
  pollId: string
  onPollDeleted: () => void
}

interface VoteData {
  userVotes: Set<string>
  totalVotes: number
}

export default function CalendarPoll({ pollId, onPollDeleted }: CalendarPollProps) {
  const [pollName, setPollName] = useState<string>("")
  const [pollDescription, setPollDescription] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [votes, setVotes] = useState<Record<string, VoteData>>({})
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [pollStatus, setPollStatus] = useState<string>("Open")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPollData()
      fetchUserEmails()
    }
  }, [user])

  const fetchPollData = async () => {
    setError(null)
    try {
      const supabase = createSupabaseClient()

      console.log(`Fetching calendar poll data for pollId: ${pollId}`)

      const { data: pollData, error: pollError } = await supabase
        .from("CalendarPoll")
        .select("name, description, startDate, endDate, ownerUser, status")
        .eq("id", pollId)
        .single()

      if (pollError) {
        console.error("Error fetching calendar poll data:", pollError)
        setError("Failed to fetch calendar poll data. Please check the console for more details.")
        return
      }

      console.log(`Calendar poll data fetched:`, pollData)
      setPollName(pollData.name)
      setPollDescription(pollData.description || "")
      setStartDate(parseISO(pollData.startDate))
      setEndDate(parseISO(pollData.endDate))
      setIsOwner(pollData.ownerUser === user.id)
      setPollStatus(pollData.status)

      // Fetch votes
      const { data: voteData, error: voteError } = await supabase
        .from("CalendarPollVote")
        .select("*")
        .eq("calendarPollId", pollId)

      if (voteError) {
        console.error("Error fetching votes:", voteError)
        setError("Failed to fetch votes. Please check the console for more details.")
        return
      }

      console.log(`CalendarPollVotes fetched: ${voteData.length} votes`)

      const newVotes: Record<string, VoteData> = {}
      voteData.forEach((vote) => {
        const key = vote.date
        if (!newVotes[key]) {
          newVotes[key] = { userVotes: new Set(), totalVotes: 0 }
        }
        newVotes[key].userVotes.add(vote.userID)
        newVotes[key].totalVotes += 1
      })

      setVotes(newVotes)
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  const fetchUserEmails = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.from("PublicUserProfile").select("uid, email")

      if (error) throw error

      const emailMap: Record<string, string> = {}
      data.forEach((user) => {
        emailMap[user.uid] = user.email
      })
      setUserEmails(emailMap)
    } catch (err) {
      console.error("Error fetching user emails:", err)
    }
  }

  const handleVote = async (date: Date) => {
    if (!user) {
      setError("You must be logged in to vote")
      return
    }

    const key = format(date, "yyyy-MM-dd")
    const hasVoted = votes[key]?.userVotes.has(user.id)

    try {
      const supabase = createSupabaseClient()
      if (hasVoted) {
        const { error } = await supabase
          .from("CalendarPollVote")
          .delete()
          .match({ calendarPollId: pollId, date: key, userID: user.id })

        if (error) {
          console.error("Error removing vote:", error)
          setError("Failed to remove vote. Please try again.")
          return
        }

        // Update local state
        setVotes((prevVotes) => {
          const updatedVotes = { ...prevVotes }
          updatedVotes[key].userVotes.delete(user.id)
          updatedVotes[key].totalVotes -= 1
          if (updatedVotes[key].totalVotes === 0) {
            delete updatedVotes[key]
          }
          return updatedVotes
        })
      } else {
        const { error } = await supabase
          .from("CalendarPollVote")
          .insert({ calendarPollId: pollId, date: key, userID: user.id })

        if (error) {
          console.error("Error adding vote:", error)
          setError("Failed to add vote. Please try again.")
          return
        }

        // Update local state
        setVotes((prevVotes) => {
          const updatedVotes = { ...prevVotes }
          if (!updatedVotes[key]) {
            updatedVotes[key] = { userVotes: new Set(), totalVotes: 0 }
          }
          updatedVotes[key].userVotes.add(user.id)
          updatedVotes[key].totalVotes += 1
          return updatedVotes
        })
      }

      console.log(`Vote ${hasVoted ? "removed" : "added"} for ${key}`)
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handlePollUpdated = () => {
    fetchPollData()
  }

  const uniqueVotersCount = useMemo(() => {
    const uniqueVoters = new Set()
    Object.values(votes).forEach((voteData) => {
      voteData.userVotes.forEach((userId) => uniqueVoters.add(userId))
    })
    return uniqueVoters.size
  }, [votes])

  const uniqueVotersEmails = useMemo(() => {
    const uniqueVoters = new Set<string>()
    Object.values(votes).forEach((voteData) => {
      voteData.userVotes.forEach((userId) => {
        const email = userEmails[userId]
        if (email) uniqueVoters.add(email)
      })
    })
    return Array.from(uniqueVoters).join(", ")
  }, [votes, userEmails])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold mb-2">{pollName}</h2>
      {pollDescription && <p className="text-gray-600 mb-4">{pollDescription}</p>}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm text-gray-500 mb-4 cursor-help">Number of unique votes: {uniqueVotersCount}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voters: {uniqueVotersEmails}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isOwner && (
        <Button variant="ghost" size="sm" className="absolute top-0 right-0" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      )}
      <CalendarView
        startDate={startDate}
        endDate={endDate}
        votes={votes}
        onVote={handleVote}
        userId={user?.id || ""}
        userEmails={userEmails}
      />
      <PollSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        pollId={pollId}
        pollType="calendar"
        currentStatus={pollStatus}
        onPollUpdated={handlePollUpdated}
        onPollDeleted={onPollDeleted}
      />
    </div>
  )
}

