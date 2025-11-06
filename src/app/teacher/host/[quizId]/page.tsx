'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, Square, Users, Eye, BarChart3, Clock, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

interface Quiz {
  id: string
  title: string
  description: string
  is_active: boolean
}

interface Session {
  id: string
  nickname: string
  score: number
  current_question: number
  is_active: boolean
  last_activity: string
}

export default function HostQuizPage() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(fetchSessions, 2000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  const fetchQuiz = async () => {
    try {
      setLoading(true)

      // Get quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('teacher_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (quizError) throw quizError

      setQuiz(quizData)

      // Get questions count
      const { data: questionsData, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('quiz_id', quizId)

      if (countError) throw countError
      setTotalQuestions(questionsData?.length || 0)

      // Get current question if quiz is live
      if (quizData.is_active) {
        setIsLive(true)
        await fetchCurrentQuestion()
      }

      await fetchSessions()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('id, nickname, score, current_question, is_active, updated_at')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false })

      if (error) throw error

      // Transform the data to match the interface
      const transformedSessions = (data || []).map(session => ({
        ...session,
        last_activity: session.updated_at
      }))

      setSessions(transformedSessions)
    } catch (err: any) {
      console.error('Error fetching sessions:', err)
    }
  }

  const fetchCurrentQuestion = async () => {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index')

      if (error) throw error

      if (questionIndex < questions.length) {
        setCurrentQuestion(questions[questionIndex])
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const startQuiz = async () => {
    try {
      // Activate quiz
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({ is_active: true })
        .eq('id', quizId)

      if (updateError) throw updateError

      setIsLive(true)
      setQuiz(prev => prev ? { ...prev, is_active: true } : null)
      await fetchCurrentQuestion()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const nextQuestion = async () => {
    try {
      const newIndex = questionIndex + 1

      if (newIndex >= totalQuestions) {
        // End quiz
        await endQuiz()
        return
      }

      setQuestionIndex(newIndex)
      setShowResults(false)

      // Update all active sessions to next question
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          current_question: newIndex
        })
        .eq('quiz_id', quizId)
        .eq('is_active', true)

      if (error) throw error

      await fetchCurrentQuestion()
      await fetchSessions()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const showQuestionResults = () => {
    setShowResults(true)
  }

  const endQuiz = async () => {
    try {
      // Deactivate quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId)

      if (quizError) throw quizError

      // End all active sessions
      const { error: sessionError } = await supabase
        .from('quiz_sessions')
        .update({
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('quiz_id', quizId)
        .eq('is_active', true)

      if (sessionError) throw sessionError

      setIsLive(false)
      setQuiz(prev => prev ? { ...prev, is_active: false } : null)
      await fetchSessions()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!quiz) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Quiz not found</AlertDescription>
      </Alert>
    )
  }

  const activeSessions = sessions.filter(s => s.is_active)
  const completedSessions = sessions.filter(s => !s.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={quiz.is_active ? "default" : "secondary"}>
            {quiz.is_active ? "Live" : "Inactive"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push('/teacher/quizzes')}
          >
            Back to Quizzes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quiz Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLive ? (
                <Button
                  onClick={startQuiz}
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  <Play className="w-5 h-5" />
                  Start Quiz
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      Question {questionIndex + 1} / {totalQuestions}
                    </div>
                    <Progress
                      value={((questionIndex + 1) / totalQuestions) * 100}
                      className="mt-2"
                    />
                  </div>

                  {!showResults ? (
                    <Button
                      onClick={showQuestionResults}
                      variant="outline"
                      className="w-full"
                    >
                      Show Results
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      className="w-full flex items-center gap-2"
                    >
                      Next Question
                    </Button>
                  )}

                  <Button
                    onClick={endQuiz}
                    variant="destructive"
                    className="w-full flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    End Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <Badge>{activeSessions.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <Badge variant="secondary">{completedSessions.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <Badge variant="outline">{sessions.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle>Current Question</CardTitle>
                <CardDescription>
                  {currentQuestion.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <Badge variant="outline">
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      <span>{option}</span>
                      {showResults && index === currentQuestion.correct_answer && (
                        <Badge className="ml-auto bg-green-100 text-green-800">
                          Correct
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {showResults && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Correct Answer:</strong> {String.fromCharCode(65 + currentQuestion.correct_answer)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No participants yet
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{session.nickname}</span>
                        {!session.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {session.score || 0} / {totalQuestions}
                        </div>
                        <div className="text-sm text-gray-500">
                          Q{session.current_question + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
