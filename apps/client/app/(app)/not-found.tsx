import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export default function AppNotFound(): React.ReactElement {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-8xl font-bold text-black dark:text-zinc-50">404</h1>
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Page Not Found
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            The page you're looking for doesn't exist in the app.
          </p>
        </div>

        <Link href="/app">
          <Button className="w-full md:w-auto">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
