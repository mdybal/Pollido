"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createSupabaseClient } from "../utils/supabase"

interface PollSettingsProps {
  isOpen: boolean
  onClose: () => void
  pollId: string
  pollType: "schedule" | "calendar"
  currentStatus: string
  onPollUpdated: () => void
  onPollDeleted: () => void
}

interface PollMember {
  id: string
  email: string
}

export default function PollSettings({
  isOpen,
  onClose,
  pollId,
  pollType,
  currentStatus,
  onPollUpdated,
  onPollDeleted,
}: PollSettingsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<PollMember[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchPollMembers()
    }
  }, [isOpen])

  const fetchPollMembers = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.from("PollMember").select("id, userID").eq("PollID", pollId)

      if (error) throw error

      const memberPromises = data.map(async (member) => {
        const { data: userData, error: userError } = await supabase
          .from("PublicUserProfile")
          .select("email")
          .eq("uid", member.userID)
          .single()

        if (userError) throw userError

        return {
          id: member.id,
          email: userData.email,
        }
      })

      const resolvedMembers = await Promise.all(memberPromises)
      setMembers(resolvedMembers)
    } catch (err) {
      console.error("Error fetching poll members:", err)
      setError("Failed to fetch poll members. Please try again.")
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from(pollType === "schedule" ? "SchedulePoll" : "CalendarPoll")
        .update({ status: newStatus })
        .eq("id", pollId)

      if (error) throw error
      onPollUpdated()
    } catch (err) {
      console.error("Error updating poll status:", err)
      setError("Failed to update poll status. Please try again.")
    }
  }

  const handleDeletePoll = async () => {
    if (confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      try {
        const supabase = createSupabaseClient()
        const { error } = await supabase
          .from(pollType === "schedule" ? "SchedulePoll" : "CalendarPoll")
          .delete()
          .eq("id", pollId)

        if (error) throw error
        onClose()
        onPollDeleted()
      } catch (err) {
        console.error("Error deleting poll:", err)
        setError("Failed to delete poll. Please try again.")
      }
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("PollMember").delete().eq("id", memberId)

      if (error) throw error

      setMembers(members.filter((member) => member.id !== memberId))
    } catch (err) {
      console.error("Error deleting member:", err)
      setError("Failed to delete member. Please try again.")
    }
  }

  const handleNewMemberInputChange = async (email: string) => {
    setNewMemberEmail(email)
    if (email.length > 2) {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from("PublicUserProfile")
          .select("email")
          .ilike("email", `${email}%`)
          .limit(5)

        if (error) throw error

        setSuggestions(data.map((user) => user.email))
      } catch (err) {
        console.error("Error fetching email suggestions:", err)
      }
    } else {
      setSuggestions([])
    }
  }

  const handleAddNewMember = async () => {
    try {
      const supabase = createSupabaseClient()

      // First, get the user ID for the email
      const { data: userData, error: userError } = await supabase
        .from("PublicUserProfile")
        .select("uid")
        .eq("email", newMemberEmail)
        .single()

      if (userError) throw userError

      // Then, add the new member to the PollMember table
      const { error: memberError } = await supabase.from("PollMember").insert({ PollID: pollId, userID: userData.uid })

      if (memberError) throw memberError

      // Refresh the member list
      await fetchPollMembers()
      setNewMemberEmail("")
      setSuggestions([])
    } catch (err) {
      console.error("Error adding new member:", err)
      setError("Failed to add new member. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Poll Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={handleStatusChange} value={status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Invited Members</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span>{member.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    className="h-6 w-6 p-0"
                  >
                    -
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="new-member">Add New Member</Label>
            <div className="flex mt-1">
              <Input
                id="new-member"
                value={newMemberEmail}
                onChange={(e) => handleNewMemberInputChange(e.target.value)}
                placeholder="Enter email"
                list="email-suggestions"
              />
              <Button onClick={handleAddNewMember} className="ml-2">
                +
              </Button>
            </div>
            {suggestions.length > 0 && (
              <datalist id="email-suggestions">
                {suggestions.map((suggestion, index) => (
                  <option key={index} value={suggestion} />
                ))}
              </datalist>
            )}
          </div>
          <Button onClick={handleDeletePoll} variant="destructive">
            Delete Poll
          </Button>
          {error && <div className="text-red-500">{error}</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

