import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface TimeSlotProps {
  day: string
  hour: string
  totalVotes: number
  hasVoted: boolean
  onVote: (day: string, hour: string) => void
  rank: number
  voterEmails: string[]
}

export default function TimeSlot({ day, hour, totalVotes, hasVoted, onVote, rank, voterEmails }: TimeSlotProps) {
  const handleVote = () => {
    onVote(day, hour)
  }

  const [displayHour, displayMinute] = hour.split(":") // Extract hour and minute parts

  const getBackgroundColor = () => {
    if (rank === 0) return "bg-white hover:bg-gray-50"
    if (rank === 1) return "bg-green-500 hover:bg-green-600"
    if (rank === 2) return "bg-green-300 hover:bg-green-400"
    if (rank === 3) return "bg-green-100 hover:bg-green-200"
  }

  return (
    <div className={`flex items-center justify-between py-1 px-2 border-b border-gray-200 ${getBackgroundColor()}`}>
      <span className="text-xs font-medium">{`${displayHour}:${displayMinute}`}</span>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="mr-1 text-xs font-semibold cursor-help">{totalVotes}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voters: {voterEmails.join(", ")}</p>
          </TooltipContent>
        </Tooltip>
        <Button
          variant={hasVoted ? "destructive" : "default"}
          size="sm"
          onClick={handleVote}
          aria-label={hasVoted ? "Remove vote" : "Add vote"}
          className="h-6 w-6 p-0"
        >
          {hasVoted ? "-" : "+"}
        </Button>
      </div>
    </div>
  )
}

export const TimeSlotWithProvider = ({ day, hour, totalVotes, hasVoted, onVote, rank, voterEmails }: TimeSlotProps) => {
  return (
    <TooltipProvider>
      <TimeSlot
        day={day}
        hour={hour}
        totalVotes={totalVotes}
        hasVoted={hasVoted}
        onVote={onVote}
        rank={rank}
        voterEmails={voterEmails}
      />
    </TooltipProvider>
  )
}

