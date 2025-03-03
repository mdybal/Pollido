"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createSupabaseClient } from "../utils/supabase"

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const { data: authListener } = createSupabaseClient().auth.onAuthStateChange((event:any, session:any) => {
      setUser(session?.user ?? null)
    })

    createSupabaseClient()
      .auth.getSession()
      .then(({ data: {session} }) => {
        setUser(session?.user ?? null)
      })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await createSupabaseClient().auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await createSupabaseClient().auth.signOut()
    if (error) throw error
  }

  const register = async (email: string, password: string) => {
    const { error } = await createSupabaseClient().auth.signUp({ email, password })
    if (error) throw error
  }

  return <AuthContext.Provider value={{ user, signIn, signOut, register }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

