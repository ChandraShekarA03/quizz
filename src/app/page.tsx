import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Quiz App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Create engaging quizzes, host live sessions, and track student progress with our interactive quiz platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started as Teacher
              </Button>
            </Link>
            <Link href="/student/join">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Join as Student
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
