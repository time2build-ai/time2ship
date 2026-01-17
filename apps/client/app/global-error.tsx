'use client';

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-6xl font-bold text-black dark:text-zinc-50">Error</h1>
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                Critical Error
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                A critical error occurred. Please refresh the page.
              </p>
              {error.digest && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:hover:bg-zinc-900"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
