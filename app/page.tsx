"use client"

import { useState } from "react"
import { useAuth } from "../components/auth-provider"
import PollSelector from "../components/poll-selector"
import WeeklySchedule from "../components/weekly-schedule"
import RegistrationForm from "../components/registration-form"

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="mb-4">Please sign in to access the schedule polling features.</p>
            <p className="mb-4">If you don't have an account, you can register below:</p>
            <RegistrationForm />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Already have an account?</h2>
            <p>Use the sign-in form in the header to access your account.</p>
          </div>
        </div>
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

