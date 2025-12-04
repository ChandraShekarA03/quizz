'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function JoinNamesGamePage() {
  const router = useRouter()
  const [gameCode, setGameCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement join names game logic
    console.log({ gameCode })
    router.push(`/student/names-game/${gameCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Join Names Game</CardTitle>
            <CardDescription>Enter the code from your teacher to join the names game.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="game-code">Game Code</Label>
                <Input
                  id="game-code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter game code"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
