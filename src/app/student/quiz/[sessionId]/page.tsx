'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, XCircle, Trophy, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: number
  time_limit: number
}

interface QuizSession {
  id: string
  quiz_id: string
  nickname: string
  score: number
  total_questions: number
  current_question: number
  is_active: boolean
  quiz: {
    title: string
    description: string
  }
}

export default function QuizPage() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isAnswered && currentQuestion) {
      handleTimeout()
    }
  }, [timeLeft, isAnswered, currentQuestion])

  const fetchSession = async () => {
    try {
      setLoading(true)

      // Get session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select(`
          id,
          quiz_id,
          nickname,
          score,
          total_questions,
          current_question,
          is_active,
          quiz:quizzes(title, description)
        `)
        .eq('id', sessionId)
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (sessionError) throw sessionError

      // Transform the data to match the interface
      const transformedSession = {
        ...sessionData,
        quiz: Array.isArray(sessionData.quiz) ? sessionData.quiz[0] : sessionData.quiz
      }

      setSession(transformedSession)

      if (!transformedSession.is_active) {
        // Quiz completed, show results
        await fetchLeaderboard(transformedSession.quiz_id)
        setLoading(false)
        return
      }

      // Get current question
      await fetchCurrentQuestion(transformedSession.quiz_id, transformedSession.current_question)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentQuestion = async (quizId: string, questionIndex: number) => {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index')

      if (error) throw error

      if (questionIndex < questions.length) {
        const question = questions[questionIndex]
        setCurrentQuestion(question)
        setTimeLeft(question.time_limit || 30)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setShowResult(false)
      } else {
        // Quiz completed
        await completeQuiz()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchLeaderboard = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('nickname, score, total_questions, completed_at')
        .eq('quiz_id', quizId)
        .not('completed_at', 'is', null)
        .order('score', { ascending: false })
        .limit(10)

      if (error) throw error
      setLeaderboard(data || [])
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err)
    }
  }

  const handleAnswer = async (answerIndex: number) => {
    if (isAnswered) return

    setSelectedAnswer(answerIndex)
    setIsAnswered(true)

    try {
      const isCorrect = answerIndex === currentQuestion!.correct_answer

      // Submit answer
      const { error } = await supabase
        .from('answers')
        .insert({
          session_id: sessionId,
          question_id: currentQuestion!.id,
          answer: answerIndex,
          is_correct: isCorrect,
          time_taken: currentQuestion!.time_limit - timeLeft
        })

      if (error) throw error

      // Update session score if correct
      if (isCorrect) {
        const { error: updateError } = await supabase
          .from('quiz_sessions')
          .update({
            score: (session!.score || 0) + 1,
            current_question: session!.current_question + 1
          })
          .eq('id', sessionId)

        if (updateError) throw updateError

        setSession(prev => prev ? {
          ...prev,
          score: (prev.score || 0) + 1,
          current_question: prev.current_question + 1
        } : null)
      } else {
        const { error: updateError } = await supabase
          .from('quiz_sessions')
          .update({
            current_question: session!.current_question + 1
          })
          .eq('id', sessionId)

        if (updateError) throw updateError

        setSession(prev => prev ? {
          ...prev,
          current_question: prev.current_question + 1
        } : null)
      }

      setShowResult(true)

      // Move to next question after delay
      setTimeout(() => {
        fetchCurrentQuestion(session!.quiz_id, session!.current_question + 1)
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleTimeout = () => {
    if (currentQuestion) {
      handleAnswer(-1) // -1 indicates timeout
    }
  }

  const completeQuiz = async () => {
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      setSession(prev => prev ? { ...prev, is_active: false } : null)
      await fetchLeaderboard(session!.quiz_id)
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

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Quiz session not found</AlertDescription>
      </Alert>
    )
  }

  if (!session.is_active) {
    // Show final results
    const percentage = session.total_questions > 0 ? (session.score / session.total_questions) * 100 : 0

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Quiz Completed!</h1>
          <p className="text-gray-600 mt-2">Great job, {session.nickname}!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{session.quiz.title}</CardTitle>
            <CardDescription className="text-center">{session.quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-indigo-600 mb-2">
                {session.score}/{session.total_questions}
              </div>
              <div className="text-xl text-gray-600">
                {percentage.toFixed(1)}% Correct
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/student/results')}>
                View All Results
              </Button>
              <Button variant="outline" onClick={() => router.push('/student/join')}>
                Join Another Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {leaderboard.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{entry.nickname}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {entry.score}/{entry.total_questions}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((entry.score / entry.total_questions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <Alert>
        <AlertDescription>Loading question...</AlertDescription>
      </Alert>
    )
  }

  const progress = ((session.current_question + 1) / session.total_questions) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{session.quiz.title}</h1>
        <p className="text-gray-600">Question {session.current_question + 1} of {session.total_questions}</p>
      </div>

      <Progress value={progress} className="w-full" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Score: {session.score || 0}/{session.total_questions}</CardTitle>
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{timeLeft}s</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showResult
                      ? index === currentQuestion.correct_answer
                        ? "default"
                        : index === selectedAnswer
                        ? "destructive"
                        : "outline"
                      : selectedAnswer === index
                      ? "default"
                      : "outline"
                  }
                  className={`w-full justify-start text-left p-4 h-auto ${
                    showResult && index === currentQuestion.correct_answer ? 'bg-green-100 border-green-500' : ''
                  } ${
                    showResult && index === selectedAnswer && index !== currentQuestion.correct_answer ? 'bg-red-100 border-red-500' : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3">
                    {showResult && index === currentQuestion.correct_answer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {showResult && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {showResult && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">
                {selectedAnswer === currentQuestion.correct_answer ? (
                  <span className="text-green-600">Correct! 🎉</span>
                ) : selectedAnswer === -1 ? (
                  <span className="text-orange-600">Time's up! ⏰</span>
                ) : (
                  <span className="text-red-600">Incorrect</span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Correct answer: {String.fromCharCode(65 + currentQuestion.correct_answer)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
