-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'active', 'completed');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status quiz_status DEFAULT 'draft',
  time_limit INTEGER, -- in minutes
  total_questions INTEGER DEFAULT 0,
  is_randomized BOOLEAN DEFAULT FALSE,
  show_results BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[],
  correct_answer INTEGER NOT NULL,
  time_limit INTEGER, -- in seconds
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create quiz_sessions table
CREATE TABLE public.quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  current_question INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER, -- in seconds
  UNIQUE(quiz_id, student_id)
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, question_id)
);

-- Create leaderboard view
CREATE VIEW public.leaderboard AS
SELECT
  qs.quiz_id,
  p.full_name,
  p.avatar_url,
  qs.score,
  qs.total_questions,
  qs.time_taken,
  qs.completed_at,
  RANK() OVER (PARTITION BY qs.quiz_id ORDER BY qs.score DESC, qs.time_taken ASC) as rank
FROM public.quiz_sessions qs
JOIN public.profiles p ON qs.student_id = p.id
WHERE qs.is_active = FALSE AND qs.completed_at IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for quizzes
CREATE POLICY "Teachers can view their own quizzes" ON public.quizzes
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view published quizzes" ON public.quizzes
  FOR SELECT USING (status = 'published' OR status = 'active');

CREATE POLICY "Admins can view all quizzes" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for questions
CREATE POLICY "Teachers can manage questions for their quizzes" ON public.questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for active quizzes" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND (status = 'published' OR status = 'active')
    )
  );

-- Create policies for quiz_sessions
CREATE POLICY "Students can view their own sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own sessions" ON public.quiz_sessions
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view sessions for their quizzes" ON public.quiz_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND teacher_id = auth.uid()
    )
  );

-- Create policies for answers
CREATE POLICY "Students can manage their own answers" ON public.answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_quizzes
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_questions
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing
INSERT INTO public.profiles (id, email, full_name, role, is_approved) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@quizapp.com', 'Admin User', 'admin', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'teacher@quizapp.com', 'Teacher User', 'teacher', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'student@quizapp.com', 'Student User', 'student', TRUE);

INSERT INTO public.quizzes (id, title, description, teacher_id, status, total_questions) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sample Quiz', 'A sample quiz for testing', '00000000-0000-0000-0000-000000000002', 'published', 3);

INSERT INTO public.questions (quiz_id, question, options, correct_answer, time_limit, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'What is 2 + 2?', ARRAY['3', '4', '5', '6'], 1, 30, 1),
  ('11111111-1111-1111-1111-111111111111', 'What is 3 + 3?', ARRAY['5', '6', '7', '8'], 1, 30, 2),
  ('11111111-1111-1111-1111-111111111111', 'What is 4 + 4?', ARRAY['7', '8', '9', '10'], 1, 30, 3);
