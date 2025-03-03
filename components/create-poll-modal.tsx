import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CreatePoll from "./create-poll"

interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  pollType: "schedule" | "calendar"
  onPollCreated: () => void
}

export default function CreatePollModal({ isOpen, onClose, pollType, onPollCreated }: CreatePollModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pollType === "schedule" ? "Create Weekly Poll" : "Create Calendar Poll"}</DialogTitle>
        </DialogHeader>
        <CreatePoll pollType={pollType} onPollCreated={onPollCreated} />
      </DialogContent>
    </Dialog>
  )
}

