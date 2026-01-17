'use client';

import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold text-black dark:text-zinc-50">Oops!</h1>
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Something went wrong
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            We encountered an unexpected error. Please try again.
          </p>
          {error.digest && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="w-full md:w-auto">
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => window.location.href = '/'}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
