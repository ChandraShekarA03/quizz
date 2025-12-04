-- SQL Server schema for Quiz App
-- Converted from PostgreSQL Supabase schema

-- Enable necessary features
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'quizapp')
BEGIN
    CREATE DATABASE quizapp
END
GO

USE quizapp
GO

-- Create custom types (using CHECK constraints instead of ENUM)
-- Note: SQL Server doesn't have native ENUM, we'll use VARCHAR with CHECK constraints

-- Create profiles table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='profiles' AND xtype='U')
BEGIN
    CREATE TABLE profiles (
        id UNIQUEIDENTIFIER PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        full_name NVARCHAR(255),
        role NVARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
        avatar_url NVARCHAR(500),
        is_approved BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    )
END
GO

-- Create quizzes table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quizzes' AND xtype='U')
BEGIN
    CREATE TABLE quizzes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        teacher_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed')),
        time_limit INT, -- in minutes
        total_questions INT DEFAULT 0,
        is_randomized BIT DEFAULT 0,
        show_results BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
END
GO

-- Create questions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='questions' AND xtype='U')
BEGIN
    CREATE TABLE questions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        quiz_id UNIQUEIDENTIFIER NOT NULL,
        question_text NVARCHAR(MAX) NOT NULL,
        question_type NVARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
        options NVARCHAR(MAX), -- JSON string for array
        correct_answer NVARCHAR(MAX) NOT NULL,
        points INT DEFAULT 1,
        time_limit INT, -- in seconds
        explanation NVARCHAR(MAX),
        order_index INT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
END
GO

-- Create quiz_sessions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quiz_sessions' AND xtype='U')
BEGIN
    CREATE TABLE quiz_sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        quiz_id UNIQUEIDENTIFIER NOT NULL,
        student_id UNIQUEIDENTIFIER NOT NULL,
        started_at DATETIME2 DEFAULT GETDATE(),
        completed_at DATETIME2,
        score INT DEFAULT 0,
        total_points INT DEFAULT 0,
        time_taken INT, -- in seconds
        is_completed BIT DEFAULT 0,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(quiz_id, student_id)
    )
END
GO

-- Create answers table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='answers' AND xtype='U')
BEGIN
    CREATE TABLE answers (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        session_id UNIQUEIDENTIFIER NOT NULL,
        question_id UNIQUEIDENTIFIER NOT NULL,
        answer NVARCHAR(MAX) NOT NULL,
        is_correct BIT NOT NULL,
        points_earned INT DEFAULT 0,
        time_taken INT, -- in seconds
        answered_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        UNIQUE(session_id, question_id)
    )
END
GO

-- Create leaderboard view
IF EXISTS (SELECT * FROM sysobjects WHERE name='leaderboard' AND xtype='V')
BEGIN
    DROP VIEW leaderboard
END
GO

CREATE VIEW leaderboard AS
SELECT
    qs.quiz_id,
    p.full_name,
    p.avatar_url,
    qs.score,
    qs.total_points,
    qs.time_taken,
    qs.completed_at,
    RANK() OVER (PARTITION BY qs.quiz_id ORDER BY qs.score DESC, qs.time_taken ASC) as rank
FROM quiz_sessions qs
JOIN profiles p ON qs.student_id = p.id
WHERE qs.is_completed = 1 AND qs.completed_at IS NOT NULL
GO

-- Create triggers for updated_at
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='trg_profiles_updated_at' AND xtype='TR')
BEGIN
    CREATE TRIGGER trg_profiles_updated_at
    ON profiles
    AFTER UPDATE
    AS
    BEGIN
        UPDATE profiles
        SET updated_at = GETDATE()
        FROM profiles p
        INNER JOIN inserted i ON p.id = i.id
    END
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='trg_quizzes_updated_at' AND xtype='TR')
BEGIN
    CREATE TRIGGER trg_quizzes_updated_at
    ON quizzes
    AFTER UPDATE
    AS
    BEGIN
        UPDATE quizzes
        SET updated_at = GETDATE()
        FROM quizzes q
        INNER JOIN inserted i ON q.id = i.id
    END
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='trg_questions_updated_at' AND xtype='TR')
BEGIN
    CREATE TRIGGER trg_questions_updated_at
    ON questions
    AFTER UPDATE
    AS
    BEGIN
        UPDATE questions
        SET updated_at = GETDATE()
        FROM questions q
        INNER JOIN inserted i ON q.id = i.id
    END
END
GO

-- Insert sample data
IF NOT EXISTS (SELECT * FROM profiles WHERE email = 'admin@quizapp.com')
BEGIN
    INSERT INTO profiles (id, email, full_name, role, is_approved)
    VALUES
        ('00000000-0000-0000-0000-000000000001', 'admin@quizapp.com', 'Admin User', 'admin', 1),
        ('00000000-0000-0000-0000-000000000002', 'teacher@quizapp.com', 'Teacher User', 'teacher', 1),
        ('00000000-0000-0000-0000-000000000003', 'student@quizapp.com', 'Student User', 'student', 1)
END
GO

IF NOT EXISTS (SELECT * FROM quizzes WHERE title = 'Sample Quiz')
BEGIN
    INSERT INTO quizzes (id, title, description, teacher_id, status, total_questions)
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'Sample Quiz', 'A sample quiz for testing', '00000000-0000-0000-0000-000000000002', 'published', 3)
END
GO

IF NOT EXISTS (SELECT * FROM questions WHERE quiz_id = '11111111-1111-1111-1111-111111111111')
BEGIN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, points, time_limit, order_index)
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'What is 2 + 2?', '["3", "4", "5", "6"]', '4', 1, 30, 1),
        ('11111111-1111-1111-1111-111111111111', 'What is 3 + 3?', '["5", "6", "7", "8"]', '6', 1, 30, 2),
        ('11111111-1111-1111-1111-111111111111', 'What is 4 + 4?', '["7", "8", "9", "10"]', '8', 1, 30, 3)
END
GO

PRINT 'Database schema created successfully!'
GO
