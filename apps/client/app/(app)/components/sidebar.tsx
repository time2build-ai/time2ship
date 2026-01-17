import Link from 'next/link';
import { LogoutButton } from './logout-button';

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-xl font-bold">Time2Ship</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/app"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Dashboard
          </Link>
          <Link
            href="/app/settings"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Settings
          </Link>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
