'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Play, User } from 'lucide-react'
import { getDatabaseHelper } from '@/lib/sqlserver'
import { useAuth } from '@/components/auth/AuthProvider'

export default function JoinQuizPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [quizCode, setQuizCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [quizDetails, setQuizDetails] = useState<any>(null)

  const handleCodeChange = async (code: string) => {
    setQuizCode(code.toUpperCase())

    if (code.length >= 6) {
      try {
        // In a real implementation, you'd have a quiz code field
        // For now, we'll search by quiz ID
        const db = await getDatabaseHelper()
        const quizData = await db.query(
          'SELECT id, title, description, is_active FROM quizzes WHERE id = @param0 AND is_active = 1',
          [code]
        )

        if (quizData.length > 0) {
          setQuizDetails(quizData[0])
          setError('')
        } else {
          throw new Error('Quiz not found')
        }
      } catch (err: any) {
        setQuizDetails(null)
        if (code.length === 6) {
          setError('Quiz not found or not active')
        }
      }
    } else {
      setQuizDetails(null)
      setError('')
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsJoining(true)
    setError('')

    try {
      if (!quizDetails) {
        throw new Error('Please enter a valid quiz code')
      }

      if (!nickname.trim()) {
        throw new Error('Please enter a nickname')
      }

      // Create or get student profile
      const db = await getDatabaseHelper()
      let profile = await db.getProfile(user?.id)

      if (!profile) {
        // Create profile if it doesn't exist
        await db.createProfile({
          id: user?.id,
          email: user?.email || '',
          full_name: nickname.trim(),
          role: 'student',
          avatar_url: null,
          is_approved: true
        })
        profile = await db.getProfile(user?.id)
      }

      if (!profile) {
        throw new Error('Failed to create or retrieve profile')
      }

      // Check if student is already in a session for this quiz
      const existingSessions = await db.query(
        'SELECT id FROM quiz_sessions WHERE quiz_id = @param0 AND student_id = @param1 AND is_active = 1',
        [quizDetails.id, profile.id]
      )

      if (existingSessions.length > 0) {
        // Resume existing session
        router.push(`/student/quiz/${existingSessions[0].id}`)
        return
      }

      // Create new session
      const sessionId = await db.createQuizSession({
        quiz_id: quizDetails.id,
        student_id: profile.id,
        is_active: true
      })

      router.push(`/student/quiz/${sessionId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Join a Quiz</h1>
        <p className="text-gray-600 mt-2">Enter a quiz code to participate</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleJoin} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Quiz Code
            </CardTitle>
            <CardDescription>
              Enter the 6-character code provided by your teacher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quizCode">Quiz Code *</Label>
              <Input
                id="quizCode"
                value={quizCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider uppercase"
                required
              />
            </div>
          </CardContent>
        </Card>

        {quizDetails && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Quiz Found!</CardTitle>
              <CardDescription className="text-green-700">
                Ready to join this quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-green-800">{quizDetails.title}</h3>
                {quizDetails.description && (
                  <p className="text-green-700 text-sm mt-1">{quizDetails.description}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nickname">Your Nickname *</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will be visible to other participants
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={!quizDetails || !nickname.trim() || isJoining}
            className="flex items-center gap-2 px-8"
          >
            <Play className="w-5 h-5" />
            {isJoining ? 'Joining Quiz...' : 'Join Quiz'}
          </Button>
        </div>
      </form>

      {!quizDetails && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enter a quiz code above to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
