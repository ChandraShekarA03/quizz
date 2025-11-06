"use client";

import { SignIn, SignUp } from '@clerk/nextjs';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Welcome to Quiz App</h1>
          <p className="text-muted-foreground">Sign in to your account or create a new one</p>
        </div>

        {mode === 'signup' ? (
          <SignUp
            routing="hash"
            signInUrl="/auth/login"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                card: 'shadow-lg',
              }
            }}
          />
        ) : (
          <SignIn
            routing="hash"
            signUpUrl="/auth/login?mode=signup"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                card: 'shadow-lg',
              }
            }}
          />
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
