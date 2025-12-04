'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, BookOpen, Trophy, Settings, LogOut, MessageSquare, FileText } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

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
                    <Link href="/teacher/create-quiz">
                      <Button className="w-full">
                        Create Quiz
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Create Names Game
                    </CardTitle>
                    <CardDescription>
                      Create a names picking game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/teacher/create-names">
                      <Button className="w-full">
                        Create Names Game
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Create Short Questions
                    </CardTitle>
                    <CardDescription>
                      Create short questions with feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/teacher/create-short">
                      <Button className="w-full">
                        Create Short Questions
                      </Button>
                    </Link>
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
                    <Link href="/student/join-quiz">
                      <Button className="w-full">
                        Join Quiz
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Join Names Game
                    </CardTitle>
                    <CardDescription>
                      Enter a code to join a names game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/student/join-names">
                      <Button className="w-full">
                        Join Names Game
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Join Short Questions
                    </CardTitle>
                    <CardDescription>
                      Enter a code to join a short questions session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/student/join-short">
                      <Button className="w-full">
                        Join Short Questions
                      </Button>
                    </Link>
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
  )
}
