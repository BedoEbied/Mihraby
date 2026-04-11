import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized | Mihraby',
  description: 'You do not have permission to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Access denied</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to view this page. Please switch accounts or return to the
          homepage.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
