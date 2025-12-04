'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Medal, Award, Search, Users, Calendar } from 'lucide-react'
import { getDatabaseHelper } from '@/lib/sqlserver'

interface LeaderboardEntry {
  quiz_title: string
  nickname: string
  score: number
  total_questions: number
  completed_at: string
  percentage: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([])
  const [quizFilter, setQuizFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    filterLeaderboard()
  }, [leaderboard, quizFilter])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)

      const db = await getDatabaseHelper()
      const leaderboardData = await db.query(
        `SELECT TOP 100
          q.title as quiz_title,
          qs.nickname,
          qs.score,
          qs.total_questions,
          qs.completed_at,
          qs.time_taken
         FROM leaderboard l
         JOIN quiz_sessions qs ON l.quiz_id = qs.quiz_id AND l.student_id = qs.student_id
         JOIN quizzes q ON qs.quiz_id = q.id
         ORDER BY qs.completed_at DESC`,
        []
      )

      const formattedData = leaderboardData.map((entry: any) => ({
        quiz_title: entry.quiz_title,
        nickname: entry.nickname || 'Anonymous',
        score: entry.score,
        total_questions: entry.total_questions,
        completed_at: entry.completed_at.toISOString(),
        percentage: entry.total_questions > 0 ? (entry.score / entry.total_questions) * 100 : 0
      }))

      setLeaderboard(formattedData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterLeaderboard = () => {
    if (!quizFilter.trim()) {
      setFilteredLeaderboard(leaderboard)
      return
    }

    const filtered = leaderboard.filter(entry =>
      entry.quiz_title.toLowerCase().includes(quizFilter.toLowerCase())
    )
    setFilteredLeaderboard(filtered)
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-sm font-bold">
          {index + 1}
        </Badge>
    }
  }

  const getRankBadgeVariant = (index: number) => {
    switch (index) {
      case 0:
        return "default"
      case 1:
        return "secondary"
      case 2:
        return "outline"
      default:
        return "outline"
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600 mt-2">See how you rank against other quiz participants</p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="quizFilter">Filter by Quiz</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="quizFilter"
                  placeholder="Search quiz titles..."
                  value={quizFilter}
                  onChange={(e) => setQuizFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setQuizFilter('')}
              disabled={!quizFilter}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredLeaderboard.length}</p>
                <p className="text-sm text-gray-600">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredLeaderboard.length > 0 ? Math.round(filteredLeaderboard[0]?.percentage || 0) : 0}%
                </p>
                <p className="text-sm text-gray-600">Top Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredLeaderboard.length > 0
                    ? new Date(filteredLeaderboard[0]?.completed_at).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
                <p className="text-sm text-gray-600">Latest Quiz</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            {quizFilter ? `Filtered results for "${quizFilter}"` : 'All quiz results'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {quizFilter ? 'No results found' : 'No quiz results yet'}
              </h3>
              <p className="text-gray-500">
                {quizFilter
                  ? 'Try adjusting your search terms'
                  : 'Complete some quizzes to see results here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaderboard.map((entry, index) => (
                <div
                  key={`${entry.quiz_title}-${entry.nickname}-${entry.completed_at}`}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getRankIcon(index)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{entry.nickname}</h3>
                        <Badge variant={getRankBadgeVariant(index)}>
                          {index < 3 ? ['1st', '2nd', '3rd'][index] : `#${index + 1}`}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{entry.quiz_title}</p>
                      <p className="text-xs text-gray-500">
                        Completed {new Date(entry.completed_at).toLocaleDateString()} at{' '}
                        {new Date(entry.completed_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {entry.score}/{entry.total_questions}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.percentage.toFixed(1)}% correct
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
