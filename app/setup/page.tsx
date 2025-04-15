"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sqlScript, setSqlScript] = useState<string | null>(null)
  const router = useRouter()

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setSqlScript(null)

    try {
      // Execute the SQL script to create tables
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up database")
      }

      if (data.sql) {
        // We need to show the SQL script for manual execution
        setSqlScript(data.sql)
        setError("Automatic setup failed. Please run the SQL script manually in the Supabase SQL editor.")
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      console.error("Error setting up database:", err)
      setError(err.message || "Failed to set up database. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-block mb-4">
          <Button variant="glass" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="w-full glass-card gradient-border">
          <CardHeader>
            <CardTitle>Database Setup</CardTitle>
            <CardDescription>Set up the database tables for the Pictionary game</CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6 mb-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {success && (
            <div className="px-6 mb-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Database tables have been created successfully.
                  <div className="mt-2">
                    <Link href="/new-game" className="text-primary underline">
                      Create a new game
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <CardContent className="space-y-4">
            <p>
              This will create the necessary database tables for the Pictionary game. This only needs to be done once.
            </p>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Make sure your Supabase project is set up and the environment variables are configured.</li>
                <li>Click the "Set Up Database" button below to create the required tables.</li>
                <li>
                  If automatic setup fails, you'll be provided with SQL to run manually in the Supabase SQL Editor.
                </li>
              </ol>
            </div>

            {sqlScript && (
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-medium">Manual Setup Required</h3>
                <p>Please copy the SQL below and run it in the Supabase SQL Editor:</p>
                <Textarea
                  value={sqlScript}
                  readOnly
                  className="font-mono text-sm h-64 overflow-auto glass-card"
                  onClick={(e) => {
                    const textarea = e.target as HTMLTextAreaElement
                    textarea.select()
                    document.execCommand("copy")
                    alert("SQL copied to clipboard!")
                  }}
                />
                <p className="text-sm text-muted-foreground">Click in the text area to select and copy all SQL.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSetup} variant="gradient" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Setting Up..." : success ? "Setup Complete" : "Set Up Database"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
