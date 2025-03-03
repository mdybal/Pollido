"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  eachWeekOfInterval,
} from "date-fns"

interface CalendarViewProps {
  startDate: Date
  endDate: Date
  votes: Record<string, { userVotes: Set<string>; totalVotes: number }>
  onVote: (date: Date) => void
  userId: string
}

export default function CalendarView({ startDate, endDate, votes, onVote, userId }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startDate)

  const weeks = useMemo(() => {
    return eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }, // Start weeks on Monday
    )
  }, [startDate, endDate])

  const calendarDays = useMemo(() => {
    return weeks.map((week) => {
      let day = startOfWeek(week, { weekStartsOn: 1 }) // Start from Monday
      const end = endOfWeek(week, { weekStartsOn: 1 }) // End on Sunday
      const weekDays = []

      while (day <= end) {
        weekDays.push(day)
        day = addDays(day, 1)
      }

      return weekDays
    })
  }, [weeks])

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

  const handleVote = (date: Date) => {
    onVote(date)
  }

  const getBackgroundColor = (date: Date) => {
    const key = format(date, "yyyy-MM-dd")
    const rank = topThreeVotes.get(key) || 0
    if (rank === 0) return "bg-white"
    if (rank === 1) return "bg-green-500"
    if (rank === 2) return "bg-green-300"
    if (rank === 3) return "bg-green-100"
  }

  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => addDays(prevMonth, -30)) // Approximate previous month
  }

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addDays(prevMonth, 30)) // Approximate next month
  }

  return (
    <div className="calendar-view">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handlePreviousMonth}>&lt; Previous</Button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button onClick={handleNextMonth}>Next &gt;</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center font-semibold py-2">
            {day}
          </div>
        ))}
      </div>
      {calendarDays.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day, dayIndex) => {
            const isGreyedOut = day < startDate || day > endDate
            const key = format(day, "yyyy-MM-dd")
            const voteData = votes[key] || { userVotes: new Set(), totalVotes: 0 }
            const hasVoted = voteData.userVotes.has(userId)

            return (
              <div
                key={dayIndex}
                className={`p-2 border ${
                  isGreyedOut ? "bg-gray-200" : getBackgroundColor(day)
                } ${!isSameMonth(day, currentMonth) ? "text-gray-400" : ""}`}
              >
                <div className="flex flex-col h-full">
                  <span className={`${isSameDay(day, new Date()) ? "font-bold" : ""} text-sm`}>{format(day, "d")}</span>
                  {!isGreyedOut && isWithinInterval(day, { start: startDate, end: endDate }) && (
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-semibold">{voteData.totalVotes}</span>
                      <Button
                        variant={hasVoted ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleVote(day)}
                        aria-label={hasVoted ? "Remove vote" : "Add vote"}
                        className="h-6 w-6 p-0 ml-1"
                      >
                        {hasVoted ? "-" : "+"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

