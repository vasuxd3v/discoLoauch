import Link from "next/link";
import { signOut } from "next-auth/react";

export default function UnauthorizedAccess({ userId }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-red-500">
        <div className="flex items-center gap-3 mb-6 text-red-400">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        </div>

        <div className="bg-red-900/30 border border-red-600 rounded-lg p-5 mb-6">
          <p className="text-lg text-red-200 mb-2">
            You are not authorized to use this tool.
          </p>
          <p className="text-red-300">
            Your account does not have the required permissions to access this
            feature.
          </p>
        </div>

        <div className="bg-gray-700 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">What can I do?</h2>
          <ol className="list-decimal ml-5 space-y-3 text-gray-300">
            <li>
              <span className="font-medium text-white">
                Check your authorization status
              </span>
              <p>
                Visit the{" "}
                <Link
                  href="/tools/check-auth"
                  className="text-blue-400 hover:underline"
                >
                  authorization status page
                </Link>{" "}
                to see your current permissions.
              </p>
            </li>
            <li>
              <span className="font-medium text-white">Request access</span>
              <p>
                Contact an administrator to authorize your account. They will
                need to use the Discord bot with your Discord ID.
              </p>
            </li>
            <li>
              <span className="font-medium text-white">
                Try logging out and back in
              </span>
              <p>
                If you were recently granted access, try{" "}
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-blue-400 hover:underline"
                >
                  signing out and back in
                </button>{" "}
                to refresh your session.
              </p>
            </li>
          </ol>
        </div>

        {userId && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-gray-300">
              For administrators:
            </h3>
            <div className="bg-gray-800 p-3 rounded font-mono text-sm text-gray-300 break-all">
              /authorize user_id:{userId}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/"
            className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/tools"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            View Available Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
