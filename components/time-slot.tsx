import { Button } from "@/components/ui/button"

interface TimeSlotProps {
  day: string
  hour: string
  totalVotes: number
  hasVoted: boolean
  onVote: (day: string, hour: string) => void
  rank: number
}

export default function TimeSlot({ day, hour, totalVotes, hasVoted, onVote, rank }: TimeSlotProps) {
  const handleVote = () => {
    onVote(day, hour)
  }

  const [displayHour, displayMinute] = hour.split(":") // Extract hour and minute parts

  const getBackgroundColor = () => {
    if (rank === 0) return "bg-white"
    if (rank === 1) return "bg-green-500"
    if (rank === 2) return "bg-green-300"
    if (rank === 3) return "bg-green-100"
  }

  return (
    <div
      className={`flex items-center justify-between py-1 px-2 border-b border-gray-200 hover:bg-gray-50 ${getBackgroundColor()}`}
    >
      <span className="text-xs font-medium">{`${displayHour}:${displayMinute}`}</span>
      <div className="flex items-center">
        <span className="mr-1 text-xs font-semibold">{totalVotes}</span>
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

