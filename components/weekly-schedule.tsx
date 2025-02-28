"use client"

import { useState, useEffect, useMemo } from "react"
import DayColumn from "./day-column"
import { createSupabaseClient } from "../utils/supabase"
import { useAuth } from "./auth-provider"

const workingHours = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minute = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minute}:00`
}) // 7:00 to 17:30

interface WeeklyScheduleProps {
  pollId: string
}

interface VoteData {
  userVotes: Set<string>
  totalVotes: number
}

export default function WeeklySchedule({ pollId }: WeeklyScheduleProps) {
  const [votes, setVotes] = useState<Record<string, VoteData>>({})
  const [pollName, setPollName] = useState<string>("")
  const [pollDescription, setPollDescription] = useState<string>("")
  const [pollDays, setPollDays] = useState<string[]>([])
  const [uniqueVoters, setUniqueVoters] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPollData()
    }
  }, [user])

  const fetchPollData = async () => {
    setError(null)
    try {
      const supabase = createSupabaseClient()

      console.log(`Fetching poll data for pollId: ${pollId}`)

      // Fetch poll name, description, and days
      const { data: pollData, error: pollError } = await supabase
        .from("SchedulePoll")
        .select("name, description, days")
        .eq("id", pollId)
        .single()

      if (pollError) {
        console.error("Error fetching poll data:", pollError)
        setError("Failed to fetch poll data. Please check the console for more details.")
        return
      }

      console.log(`Poll data fetched:`, pollData)
      setPollName(pollData.name)
      setPollDescription(pollData.description || "")
      setPollDays(pollData.days ? pollData.days.split(",").map((day: string) => day.trim()) : [])

      // Fetch votes
      console.log(`Fetching SchedulePollVotes for pollId: ${pollId}`)
      const { data: voteData, error: voteError } = await supabase
        .from("SchedulePollVote")
        .select("*")
        .eq("schedulePollId", pollId)

      if (voteError) {
        console.error("Error fetching votes:", voteError)
        setError("Failed to fetch votes. Please check the console for more details.")
        return
      }

      console.log(`SchedulePollVotes fetched: ${voteData.length} votes`)

      const newVotes: Record<string, VoteData> = {}
      const uniqueUserIds = new Set<string>()

      voteData.forEach((vote) => {
        const key = `${vote.day}-${vote.hour}`
        if (!newVotes[key]) {
          newVotes[key] = { userVotes: new Set(), totalVotes: 0 }
        }
        newVotes[key].userVotes.add(vote.userID)
        newVotes[key].totalVotes += 1
        uniqueUserIds.add(vote.userID)
      })

      setVotes(newVotes)
      setUniqueVoters(uniqueUserIds.size)
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  const handleVote = async (day: string, hour: string) => {
    if (!user) {
      setError("You must be logged in to vote")
      return
    }

    const key = `${day}-${hour}`
    const hasVoted = votes[key]?.userVotes.has(user.id)

    try {
      const supabase = createSupabaseClient()
      if (hasVoted) {
        const { error } = await supabase
          .from("SchedulePollVote")
          .delete()
          .match({ schedulePollId: pollId, day, hour, userID: user.id })

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
          return updatedVotes
        })
      } else {
        const { error } = await supabase
          .from("SchedulePollVote")
          .insert({ schedulePollId: pollId, day, hour, userID: user.id })

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

      console.log(`Vote ${hasVoted ? "removed" : "added"} for ${day} ${hour}`)

      // Recalculate unique voters
      const allUserIds = new Set<string>()
      Object.values(votes).forEach((voteData) => {
        voteData.userVotes.forEach((userId) => allUserIds.add(userId))
      })
      setUniqueVoters(allUserIds.size)
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const topThreeVotes = useMemo(() => {
    const sortedVotes = Object.entries(votes)
      .filter(([_, voteData]) => voteData.totalVotes > 0)
      .sort((a, b) => b[1].totalVotes - a[1].totalVotes)

    const uniqueVoteCounts = Array.from(new Set(sortedVotes.map(([_, voteData]) => voteData.totalVotes)))
    const top3VoteCounts = uniqueVoteCounts.slice(0, 3)

    return new Map(
      sortedVotes
        .filter(([_, voteData]) => top3VoteCounts.includes(voteData.totalVotes))
        .map(([key, voteData]) => [key, top3VoteCounts.indexOf(voteData.totalVotes) + 1]),
    )
  }, [votes])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div>
      <div className="flex items-baseline mb-2">
        <h2 className="text-2xl font-bold">{pollName}</h2>
        <span className="ml-2 text-sm text-gray-500">Number of unique votes: {uniqueVoters}</span>
      </div>
      {pollDescription && <p className="text-gray-600 mb-4">{pollDescription}</p>}
      <div className="overflow-x-auto">
        <div className="flex min-w-max">
          {pollDays.map((day, index) => (
            <DayColumn
              key={day}
              day={day}
              hours={workingHours}
              votes={votes}
              onVote={handleVote}
              userId={user?.id || ""}
              isLastDay={index === pollDays.length - 1}
              topThreeVotes={topThreeVotes}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

