'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Save, Clock, Users } from 'lucide-react'
import { getDatabaseHelper } from '@/lib/sqlserver'
import { useAuth } from '@/components/auth/AuthProvider'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  timeLimit: number
}

export default function CreateQuizPage() {
  const router = useRouter()
  const { user } = useAuth()
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
      const db = await getDatabaseHelper()
      const quizId = await db.createQuiz({
        title: title.trim(),
        description: description.trim(),
        teacher_id: user?.id,
        status: 'draft',
        total_questions: questions.length,
        is_randomized: false,
        show_results: true
      })

      // Create questions
      for (const q of questions) {
        await db.query(
          'INSERT INTO questions (quiz_id, question, options, correct_answer, time_limit, order_index) VALUES (@param0, @param1, @param2, @param3, @param4, @param5)',
          [quizId, q.question.trim(), JSON.stringify(q.options.map(opt => opt.trim())), q.correctAnswer, q.timeLimit, questions.indexOf(q) + 1]
        )
      }

      router.push('/teacher/quizzes')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="text-gray-600">Build an interactive quiz for your students</p>
        </div>
        <Button onClick={addQuestion} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>

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

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
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
  )
}
