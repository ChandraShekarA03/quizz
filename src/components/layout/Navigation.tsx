'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  X,
  Home,
  User,
  Settings,
  LogOut,
  Trophy,
  BookOpen,
  Users
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Users },
]

const teacherNavigation = [
  { name: 'My Quizzes', href: '/teacher/quizzes', icon: BookOpen },
  { name: 'Create Quiz', href: '/teacher/create', icon: BookOpen },
  { name: 'Analytics', href: '/teacher/analytics', icon: Trophy },
]

const studentNavigation = [
  { name: 'Join Quiz', href: '/student/join', icon: BookOpen },
  { name: 'My Results', href: '/student/results', icon: Trophy },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const getNavigationItems = () => {
    if (!profile) return navigation

    switch (profile.role) {
      case 'admin':
        return [...navigation, ...adminNavigation]
      case 'teacher':
        return [...navigation, ...teacherNavigation]
      case 'student':
        return [...navigation, ...studentNavigation]
      default:
        return navigation
    }
  }

  const getRoleBadge = () => {
    if (!profile?.role) return null

    const variants = {
      admin: 'destructive',
      teacher: 'default',
      student: 'secondary'
    } as const

    return (
      <Badge variant={variants[profile.role as keyof typeof variants]}>
        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
      </Badge>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                QuizApp
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {getNavigationItems().map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      pathname === item.href
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {getRoleBadge()}
            <span className="text-sm text-gray-700">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {getNavigationItems().map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                    pathname === item.href
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-2 inline" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                {getRoleBadge()}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Button
                variant="ghost"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-2 inline" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
