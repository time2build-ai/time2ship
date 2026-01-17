import { getCurrentUser } from '@/shared/lib/auth/session';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button placeholder */}
          <button className="md:hidden">
            <span className="sr-only">Open menu</span>
            {/* Add menu icon here if needed */}
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
