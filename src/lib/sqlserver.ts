import sql from 'mssql'

// Database configuration
const config: sql.config = {
  server: process.env.SQL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.SQL_SERVER_PORT || '1433'),
  database: process.env.SQL_SERVER_DATABASE || 'quizapp',
  user: process.env.SQL_SERVER_USER || 'sa',
  password: process.env.SQL_SERVER_PASSWORD || '',
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true, // For local development
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Create connection pool
let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

// Database types
export type Database = {
  tables: {
    profiles: {
      id: string
      email: string
      full_name: string | null
      role: 'admin' | 'teacher' | 'student'
      avatar_url: string | null
      is_approved: boolean
      created_at: Date
      updated_at: Date
    }
    quizzes: {
      id: string
      title: string
      description: string | null
      teacher_id: string
      status: 'draft' | 'published' | 'active' | 'completed'
      time_limit: number | null
      total_questions: number
      is_randomized: boolean
      show_results: boolean
      created_at: Date
      updated_at: Date
    }
    questions: {
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
      created_at: Date
      updated_at: Date
    }
    quiz_sessions: {
      id: string
      quiz_id: string
      student_id: string
      started_at: Date
      completed_at: Date | null
      score: number
      total_points: number
      time_taken: number | null
      is_completed: boolean
    }
    answers: {
      id: string
      session_id: string
      question_id: string
      answer: string
      is_correct: boolean
      points_earned: number
      time_taken: number | null
      answered_at: Date
    }
  }
  views: {
    leaderboard: {
      quiz_id: string
      full_name: string | null
      avatar_url: string | null
      score: number
      total_points: number
      time_taken: number | null
      completed_at: Date | null
      rank: number | null
    }
  }
}

// Helper functions for common operations
export class DatabaseHelper {
  private pool: sql.ConnectionPool

  constructor(pool: sql.ConnectionPool) {
    this.pool = pool
  }

  // Generic query execution
  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const request = this.pool.request()
    params.forEach((param, index) => {
      request.input(`param${index}`, param)
    })
    const result = await request.query(query)
    return result.recordset
  }

  // Get profile by ID
  async getProfile(id: string): Promise<Database['tables']['profiles'] | null> {
    const result = await this.query<Database['tables']['profiles']>(
      'SELECT * FROM profiles WHERE id = @param0',
      [id]
    )
    return result[0] || null
  }

  // Create profile
  async createProfile(profile: Omit<Database['tables']['profiles'], 'created_at' | 'updated_at'>): Promise<void> {
    await this.query(
      `INSERT INTO profiles (id, email, full_name, role, avatar_url, is_approved, created_at, updated_at)
       VALUES (@param0, @param1, @param2, @param3, @param4, @param5, GETDATE(), GETDATE())`,
      [profile.id, profile.email, profile.full_name, profile.role, profile.avatar_url, profile.is_approved]
    )
  }

  // Update profile
  async updateProfile(id: string, updates: Partial<Database['tables']['profiles']>): Promise<void> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined)
    if (fields.length === 0) return

    const setClause = fields.map((field, index) => `${field} = @param${index + 1}`).join(', ')
    const values = fields.map(field => updates[field as keyof typeof updates])

    await this.query(
      `UPDATE profiles SET ${setClause}, updated_at = GETDATE() WHERE id = @param0`,
      [id, ...values]
    )
  }

  // Get quizzes by teacher
  async getQuizzesByTeacher(teacherId: string): Promise<Database['tables']['quizzes'][]> {
    return this.query<Database['tables']['quizzes']>(
      'SELECT * FROM quizzes WHERE teacher_id = @param0 ORDER BY created_at DESC',
      [teacherId]
    )
  }

  // Get quiz with questions
  async getQuizWithQuestions(quizId: string): Promise<{
    quiz: Database['tables']['quizzes']
    questions: Database['tables']['questions'][]
  } | null> {
    const quizResult = await this.query<Database['tables']['quizzes']>(
      'SELECT * FROM quizzes WHERE id = @param0',
      [quizId]
    )
    if (!quizResult[0]) return null

    const questions = await this.query<Database['tables']['questions']>(
      'SELECT * FROM questions WHERE quiz_id = @param0 ORDER BY order_index',
      [quizId]
    )

    return {
      quiz: quizResult[0],
      questions
    }
  }

  // Create quiz session
  async createQuizSession(session: Omit<Database['tables']['quiz_sessions'], 'started_at'>): Promise<string> {
    const id = crypto.randomUUID()
    await this.query(
      `INSERT INTO quiz_sessions (id, quiz_id, student_id, started_at, score, total_points, is_completed)
       VALUES (@param0, @param1, @param2, GETDATE(), @param3, @param4, @param5)`,
      [id, session.quiz_id, session.student_id, session.score, session.total_points, session.is_completed]
    )
    return id
  }

  // Get leaderboard
  async getLeaderboard(quizId: string): Promise<Database['views']['leaderboard'][]> {
    return this.query<Database['views']['leaderboard']>(
      'SELECT * FROM leaderboard WHERE quiz_id = @param0 ORDER BY rank',
      [quizId]
    )
  }
}

// Export singleton instance
let dbHelper: DatabaseHelper | null = null

export async function getDatabaseHelper(): Promise<DatabaseHelper> {
  if (!dbHelper) {
    const connectionPool = await getConnection()
    dbHelper = new DatabaseHelper(connectionPool)
  }
  return dbHelper
}
