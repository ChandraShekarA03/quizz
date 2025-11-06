'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Users,
  Clock,
  BarChart3,
  MoreVertical,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

interface Quiz {
  id: string
  title: string
  description: string
  is_active: boolean
  created_at: string
  questions_count: number
  sessions_count: number
}

export default function TeacherQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          is_active,
          created_at,
          questions:questions(count),
          sessions:quiz_sessions(count)
        `)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include counts
      const transformedQuizzes = data.map(quiz => ({
        ...quiz,
        questions_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
        sessions_count: Array.isArray(quiz.sessions) ? quiz.sessions.length : 0
      }))

      setQuizzes(transformedQuizzes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !currentStatus })
        .eq('id', quizId)

      if (error) throw error

      setQuizzes(quizzes.map(quiz =>
        quiz.id === quizId
          ? { ...quiz, is_active: !currentStatus }
          : quiz
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600">Manage and monitor your quiz collection</p>
        </div>
        <Link href="/teacher/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first quiz to get started with interactive learning
            </p>
            <Link href="/teacher/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                    {quiz.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {quiz.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/teacher/quizzes/${quiz.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/teacher/quizzes/${quiz.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Quiz
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleQuizStatus(quiz.id, quiz.is_active)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {quiz.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Quiz
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={quiz.is_active ? 'default' : 'secondary'}>
                    {quiz.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span>{quiz.questions_count} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{quiz.sessions_count} sessions</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {quiz.is_active && (
                    <Button size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Session
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teacher/quizzes/${quiz.id}/analytics`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
