import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseHelper } from '@/lib/sqlserver'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabaseHelper()

    // Get completed quiz sessions with results
    const resultsData = await db.query(
      `SELECT qs.id, qs.quiz_id, qs.score, qs.total_questions, qs.time_taken, qs.completed_at,
              q.title, q.description
       FROM quiz_sessions qs
       JOIN quizzes q ON qs.quiz_id = q.id
       WHERE qs.student_id = @param0 AND qs.completed_at IS NOT NULL
       ORDER BY qs.completed_at DESC`,
      [userId]
    )

    // Transform the data to match the interface
    const transformedResults = resultsData.map((result: any) => ({
      id: result.id,
      quiz_id: result.quiz_id,
      score: result.score,
      total_questions: result.total_questions,
      time_taken: result.time_taken,
      completed_at: result.completed_at,
      quiz: {
        title: result.title,
        description: result.description
      }
    }))

    return NextResponse.json(transformedResults)
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
