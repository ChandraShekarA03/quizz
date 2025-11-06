import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'teacher' | 'student'
          avatar_url: string | null
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          avatar_url?: string | null
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'teacher' | 'student'
          avatar_url?: string | null
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          teacher_id: string
          status: 'draft' | 'published' | 'active' | 'completed'
          time_limit: number | null
          total_questions: number
          is_randomized: boolean
          show_results: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          teacher_id: string
          status?: 'draft' | 'published' | 'active' | 'completed'
          time_limit?: number | null
          total_questions?: number
          is_randomized?: boolean
          show_results?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          teacher_id?: string
          status?: 'draft' | 'published' | 'active' | 'completed'
          time_limit?: number | null
          total_questions?: number
          is_randomized?: boolean
          show_results?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          options: any | null
          correct_answer: string
          points: number
          time_limit: number | null
          explanation: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          options?: any | null
          correct_answer: string
          points?: number
          time_limit?: number | null
          explanation?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
          options?: any | null
          correct_answer?: string
          points?: number
          time_limit?: number | null
          explanation?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      quiz_sessions: {
        Row: {
          id: string
          quiz_id: string
          student_id: string
          started_at: string
          completed_at: string | null
          score: number
          total_points: number
          time_taken: number | null
          is_completed: boolean
        }
        Insert: {
          id?: string
          quiz_id: string
          student_id: string
          started_at?: string
          completed_at?: string | null
          score?: number
          total_points?: number
          time_taken?: number | null
          is_completed?: boolean
        }
        Update: {
          id?: string
          quiz_id?: string
          student_id?: string
          started_at?: string
          completed_at?: string | null
          score?: number
          total_points?: number
          time_taken?: number | null
          is_completed?: boolean
        }
      }
      answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          answer: string
          is_correct: boolean
          points_earned: number
          time_taken: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          answer: string
          is_correct: boolean
          points_earned?: number
          time_taken?: number | null
          answered_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          answer?: string
          is_correct?: boolean
          points_earned?: number
          time_taken?: number | null
          answered_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          quiz_id: string
          full_name: string | null
          avatar_url: string | null
          score: number
          total_points: number
          time_taken: number | null
          completed_at: string | null
          rank: number | null
        }
      }
    }
  }
}
