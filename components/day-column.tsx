import TimeSlot from "./time-slot"

interface DayColumnProps {
  day: string
  hours: string[]
  votes: Record<string, { userVotes: Set<string>; totalVotes: number }>
  onVote: (day: string, hour: string) => void
  userId: string
  isLastDay: boolean
  topThreeVotes: Map<string, number>
}

export default function DayColumn({ day, hours, votes, onVote, userId, isLastDay, topThreeVotes }: DayColumnProps) {
  return (
    <div className={`flex-1 min-w-[120px] ${!isLastDay ? "border-r border-gray-300" : ""}`}>
      <h2 className="text-center font-semibold py-2 bg-gray-100 border-b border-gray-300">{day}</h2>
      <div>
        {hours.map((hour) => {
          const key = `${day}-${hour}`
          const voteData = votes[key] || { userVotes: new Set(), totalVotes: 0 }
          const hasVoted = voteData.userVotes.has(userId)
          const rank = topThreeVotes.get(key) || 0

          return (
            <TimeSlot
              key={hour}
              day={day}
              hour={hour}
              totalVotes={voteData.totalVotes}
              hasVoted={hasVoted}
              onVote={onVote}
              rank={rank}
            />
          )
        })}
      </div>
    </div>
  )
}

