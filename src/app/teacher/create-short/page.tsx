'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateShortQuestionsPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement short questions creation logic
    console.log({ title, questions: questions.split('\n') })
    router.push('/teacher/quizzes')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
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
            <CardTitle>Create Short Questions Game</CardTitle>
            <CardDescription>Create a new short questions game with feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Game Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 'Weekly Review'"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="questions">Questions (one per line)</Label>
                <Textarea
                  id="questions"
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Enter questions, each on a new line"
                  required
                  rows={10}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Game
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
