"use client"

import { useState } from "react"
import { useAuth } from "../components/auth-provider"
import PollSelector from "../components/poll-selector"
import WeeklySchedule from "../components/weekly-schedule"

export default function SchedulePoolingPage() {
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSelectPoll = (pollId: string) => {
    setSelectedPollId(pollId)
  }

  if (!user) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Schedule Polling</h1>
        <p>Please sign in to access the schedule polling features.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Schedule Polling</h1>
      <div className="mb-6">
        <PollSelector onSelectPoll={handleSelectPoll} />
      </div>
      {selectedPollId && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mt-6 p-4">
          <WeeklySchedule key={selectedPollId} pollId={selectedPollId} />
        </div>
      )}
    </main>
  )
}

