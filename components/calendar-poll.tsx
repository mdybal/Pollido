"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "../utils/supabase"
import { useAuth } from "./auth-provider"

interface CalendarPollProps {
  pollId: string
}

export default function CalendarPoll({ pollId }: CalendarPollProps) {
  const [pollName, setPollName] = useState<string>("")
  const [pollDescription, setPollDescription] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPollData()
    }
  }, [user]) // Removed unnecessary pollId dependency

  const fetchPollData = async () => {
    setError(null)
    try {
      const supabase = createSupabaseClient()

      console.log(`Fetching calendar poll data for pollId: ${pollId}`)

      const { data: pollData, error: pollError } = await supabase
        .from("CalendarPoll")
        .select("name, description")
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
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please check the console for more details.")
    }
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">{pollName}</h2>
      {pollDescription && <p className="text-gray-600 mb-4">{pollDescription}</p>}
      <p>Calendar poll component is under development. Poll ID: {pollId}</p>
    </div>
  )
}

