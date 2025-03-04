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
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  max,
  min,
} from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CalendarViewProps {
  startDate: Date
  endDate: Date
  votes: Record<string, { userVotes: Set<string>; totalVotes: number }>
  onVote: (date: Date) => void
  userId: string
  userEmails: Record<string, string>
}

export default function CalendarView({ startDate, endDate, votes, onVote, userId, userEmails }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startDate)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDay = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDay = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDay, end: endDay })
  }, [currentMonth])

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
    setCurrentMonth((prevMonth) => max([startOfMonth(addDays(prevMonth, -1)), startOfMonth(startDate)]))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => min([startOfMonth(addDays(endOfMonth(prevMonth), 1)), startOfMonth(endDate)]))
  }

  const isPreviousMonthDisabled = isBefore(startOfMonth(currentMonth), startOfMonth(startDate))
  const isNextMonthDisabled = isAfter(endOfMonth(currentMonth), endOfMonth(endDate))

  return (
    <div className="calendar-view">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handlePreviousMonth} disabled={isPreviousMonthDisabled}>
          &lt; Previous
        </Button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button onClick={handleNextMonth} disabled={isNextMonthDisabled}>
          Next &gt;
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center font-semibold py-2">
            {day}
          </div>
        ))}
      </div>
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isWithinPollRange = isWithinInterval(day, { start: startDate, end: endDate })
            const key = format(day, "yyyy-MM-dd")
            const voteData = votes[key] || { userVotes: new Set(), totalVotes: 0 }
            const hasVoted = voteData.userVotes.has(userId)
            const voterEmails = Array.from(voteData.userVotes)
              .map((id) => userEmails[id])
              .filter(Boolean)

            return (
              <div
                key={index}
                className={`p-2 border ${
                  isCurrentMonth ? (isWithinPollRange ? getBackgroundColor(day) : "bg-gray-100") : "bg-gray-200"
                }`}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`${isSameDay(day, new Date()) ? "font-bold" : ""} ${
                      isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    } text-sm`}
                  >
                    {format(day, "d")}
                  </span>
                  {isWithinPollRange && isCurrentMonth && (
                    <div className="flex items-center justify-between mt-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs font-semibold cursor-help">{voteData.totalVotes}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Voters: {voterEmails.join(", ")}</p>
                        </TooltipContent>
                      </Tooltip>
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
      </TooltipProvider>
    </div>
  )
}

