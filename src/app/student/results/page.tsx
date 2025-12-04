'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Target, Clock, TrendingUp, Home } from 'lucide-react'
import Link from 'next/link'
import { getDatabaseHelper } from '@/lib/sqlserver'
import { useAuth } from '@/components/auth/AuthProvider'

interface QuizResult {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  time_taken: number
  completed_at: string
  quiz: {
    title: string
    description: string
  }
}

export default function StudentResultsPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)

      const db = await getDatabaseHelper()

      // Get completed quiz sessions with results
      const resultsData = await db.query(
        `SELECT qs.id, qs.quiz_id, qs.score, qs.total_questions, qs.time_taken, qs.completed_at,
                q.title, q.description
         FROM quiz_sessions qs
         JOIN quizzes q ON qs.quiz_id = q.id
         WHERE qs.student_id = @param0 AND qs.completed_at IS NOT NULL
         ORDER BY qs.completed_at DESC`,
        [user?.id]
      )

      // Transform the data to match the interface
      const transformedResults = resultsData.map((result: any) => ({
        id: result.id,
        quiz_id: result.quiz_id,
        score: result.score,
        total_questions: result.total_questions,
        time_taken: result.time_taken,
        completed_at: result.completed_at,
        quiz: {
          title: result.title,
          description: result.description
        }
      }))

      setResults(transformedResults)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quiz Results</h1>
          <p className="text-gray-600">Review your quiz performance and progress</p>
        </div>
        <Link href="/student/join">
          <Button className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Join New Quiz
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz results yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Complete your first quiz to see your results here
            </p>
            <Link href="/student/join">
              <Button>
                <Target className="w-4 h-4 mr-2" />
                Join Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {result.quiz.title}
                    </CardTitle>
                    {result.quiz.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {result.quiz.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getScoreBadgeVariant(result.score, result.total_questions)}>
                    {result.score}/{result.total_questions}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(result.completed_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Score</span>
                    <span className={`font-semibold ${getScoreColor(result.score, result.total_questions)}`}>
                      {Math.round((result.score / result.total_questions) * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Time Taken
                    </span>
                    <span className="font-medium">{formatTime(result.time_taken)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Questions
                    </span>
                    <span className="font-medium">{result.total_questions}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Completed on {new Date(result.completed_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
