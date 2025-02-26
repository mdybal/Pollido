"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSupabaseClient } from "../utils/supabase"

export default function Header() {
  const { user, signIn, signOut } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await createSupabaseClient().auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Schedule Polling
        </Link>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span>Welcome, {user.email}</span>
              <Button onClick={signOut}>Sign Out</Button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="flex items-center space-x-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit">Sign In</Button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}

