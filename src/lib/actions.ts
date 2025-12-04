'use server'

import { getDatabaseHelper } from './sqlserver'
import type { Database } from './sqlserver'

// Profile actions
export async function getProfile(id: string) {
  const db = await getDatabaseHelper()
  return await db.getProfile(id)
}

export async function createProfile(profile: Omit<Database['tables']['profiles'], 'created_at' | 'updated_at'>) {
  const db = await getDatabaseHelper()
  await db.createProfile(profile)
}

export async function updateProfile(id: string, updates: Partial<Database['tables']['profiles']>) {
  const db = await getDatabaseHelper()
  await db.updateProfile(id, updates)
}

// Quiz actions
export async function getQuizzesByTeacher(teacherId: string) {
  const db = await getDatabaseHelper()
  return await db.getQuizzesByTeacher(teacherId)
}

export async function getQuizWithQuestions(quizId: string) {
  const db = await getDatabaseHelper()
  return await db.getQuizWithQuestions(quizId)
}

export async function createQuiz(quiz: Omit<Database['tables']['quizzes'], 'id' | 'created_at' | 'updated_at'>) {
  const db = await getDatabaseHelper()
  const id = crypto.randomUUID()
  await db.query(
    `INSERT INTO quizzes (id, title, description, teacher_id, status, time_limit, total_questions, is_randomized, show_results, created_at, updated_at)
     VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, GETDATE(), GETDATE())`,
    [id, quiz.title, quiz.description, quiz.teacher_id, quiz.status, quiz.time_limit, quiz.total_questions, quiz.is_randomized, quiz.show_results]
  )
  return id
}

// Question actions
export async function createQuestion(question: Omit<Database['tables']['questions'], 'id' | 'created_at' | 'updated_at'>) {
  const db = await getDatabaseHelper()
  const id = crypto.randomUUID()
  await db.query(
    `INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points, time_limit, explanation, order_index, created_at, updated_at)
     VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, GETDATE(), GETDATE())`,
    [id, question.quiz_id, question.question_text, question.question_type, JSON.stringify(question.options), question.correct_answer, question.points, question.time_limit, question.explanation, question.order_index]
  )
  return id
}

// Session actions
export async function createQuizSession(session: Omit<Database['tables']['quiz_sessions'], 'id' | 'started_at'>) {
  const db = await getDatabaseHelper()
  return await db.createQuizSession(session)
}

export async function getQuizSession(sessionId: string) {
  const db = await getDatabaseHelper()
  const result = await db.query<Database['tables']['quiz_sessions']>(
    'SELECT * FROM quiz_sessions WHERE id = @param0',
    [sessionId]
  )
  return result[0] || null
}

export async function updateQuizSession(id: string, updates: Partial<Database['tables']['quiz_sessions']>) {
  const db = await getDatabaseHelper()
  const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined)
  if (fields.length === 0) return

  const setClause = fields.map((field, index) => `${field} = @param${index + 1}`).join(', ')
  const values = fields.map(field => updates[field as keyof typeof updates])

  await db.query(
    `UPDATE quiz_sessions SET ${setClause} WHERE id = @param0`,
    [id, ...values]
  )
}

// Answer actions
export async function createAnswer(answer: Omit<Database['tables']['answers'], 'id' | 'answered_at'>) {
  const db = await getDatabaseHelper()
  const id = crypto.randomUUID()
  await db.query(
    `INSERT INTO answers (id, session_id, question_id, answer, is_correct, points_earned, time_taken, answered_at)
     VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, GETDATE())`,
    [id, answer.session_id, answer.question_id, answer.answer, answer.is_correct, answer.points_earned, answer.time_taken]
  )
  return id
}

export async function getAnswersBySession(sessionId: string) {
  const db = await getDatabaseHelper()
  return await db.query<Database['tables']['answers']>(
    'SELECT * FROM answers WHERE session_id = @param0 ORDER BY answered_at',
    [sessionId]
  )
}

// Leaderboard actions
export async function getLeaderboard(quizId: string) {
  const db = await getDatabaseHelper()
  return await db.getLeaderboard(quizId)
}

// Admin actions
export async function getAllProfiles() {
  const db = await getDatabaseHelper()
  return await db.query<Database['tables']['profiles']>(
    'SELECT * FROM profiles ORDER BY created_at DESC'
  )
}

export async function approveTeacher(id: string) {
  const db = await getDatabaseHelper()
  await db.updateProfile(id, { is_approved: true })
}

export async function rejectTeacher(id: string) {
  const db = await getDatabaseHelper()
  await db.updateProfile(id, { is_approved: false })
}
