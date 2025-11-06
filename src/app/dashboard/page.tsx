'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, BookOpen, Trophy, Settings, LogOut, Plus, Trash2, Save, Clock } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  timeLimit: number
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [isCreateQuizModalOpen, setCreateQuizModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.push('/auth/login')
    }
  }, [user, profile, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isAdmin = profile.role === 'admin'
  const isTeacher = profile.role === 'teacher'
  const isStudent = profile.role === 'student'

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile.full_name || user.email}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 capitalize">
                {profile.role} Dashboard
              </p>
            </div>
            <div className="flex gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Role-specific content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isAdmin && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Teacher Management
                    </CardTitle>
                    <CardDescription>
                      Approve teacher accounts and manage permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin">
                      <Button className="w-full">
                        Manage Teachers
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      System Settings
                    </CardTitle>
                    <CardDescription>
                      Configure system-wide settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      System Settings
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {isTeacher && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Create Quiz
                    </CardTitle>
                    <CardDescription>
                      Design and create new quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setCreateQuizModalOpen(true)}>
                      Create Quiz
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Host Session
                    </CardTitle>
                    <CardDescription>
                      Start a live quiz session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      Host Session
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Analytics
                    </CardTitle>
                    <CardDescription>
                      View quiz performance and student analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {isStudent && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Join Quiz
                    </CardTitle>
                    <CardDescription>
                      Enter a quiz code to join a session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      Join Quiz
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      My Progress
                    </CardTitle>
                    <CardDescription>
                      View your quiz history and scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Progress
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Settings Card */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/settings">
                  <Button className="w-full">
                    Go to Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email: {user.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Role: <span className="capitalize">{profile.role}</span>
                  </p>
                  {isTeacher && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status: {profile.is_approved ? 'Approved' : 'Pending Approval'}
                    </p>
                  )}
                </div>
                {isTeacher && !profile.is_approved && (
                  <div className="text-yellow-600 dark:text-yellow-400 text-sm">
                    Your account is pending admin approval
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CreateQuizModal isOpen={isCreateQuizModalOpen} onClose={() => setCreateQuizModalOpen(false)} />
    </>
  )
}

function CreateQuizModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30
    }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) }
        : q
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Validate quiz
      if (!title.trim()) {
        throw new Error('Quiz title is required')
      }

      if (questions.length === 0) {
        throw new Error('At least one question is required')
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (!q.question.trim()) {
          throw new Error(`Question ${i + 1} is required`)
        }
        if (q.options.some(opt => !opt.trim())) {
          throw new Error(`All options for question ${i + 1} are required`)
        }
        if (q.timeLimit < 5 || q.timeLimit > 300) {
          throw new Error(`Time limit for question ${i + 1} must be between 5-300 seconds`)
        }
      }

      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title.trim(),
          description: description.trim(),
          teacher_id: (await supabase.auth.getUser()).data.user?.id,
          is_active: false
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Create questions
      const questionsToInsert = questions.map(q => ({
        quiz_id: quiz.id,
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correct_answer: q.correctAnswer,
        time_limit: q.timeLimit
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      onClose()
      router.push('/teacher/quizzes')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
        </DialogHeader>
        <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Provide basic information about your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional quiz description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions</h2>
              <Badge variant="secondary">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                      placeholder="Enter your question"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        <Label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                            className="text-indigo-600"
                          />
                          Option {String.fromCharCode(65 + optionIndex)} *
                        </Label>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <Label htmlFor={`time-${question.id}`}>Time Limit (seconds)</Label>
                    </div>
                    <Input
                      id={`time-${question.id}`}
                      type="number"
                      min="5"
                      max="300"
                      value={question.timeLimit}
                      onChange={(e) => updateQuestion(question.id, 'timeLimit', parseInt(e.target.value) || 30)}
                      className="w-24"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="button" onClick={addQuestion} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Question
          </Button>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </div>
      </DialogContent>
    </Dialog>
  )
}
