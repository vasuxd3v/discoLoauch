"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

export default function CheckAuthPage() {
  const { data: session, status } = useSession();
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check-authorization");
        const data = await response.json();
        setAuthStatus(data);
      } catch (err) {
        setError(err.message || "Failed to check auth status");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      checkAuth();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-purple-600 rounded-full mb-4"></div>
            <p className="text-gray-300">Loading authorization status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <h1 className="text-2xl font-bold mb-6">Authorization Status</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!session && (
            <div className="bg-amber-900/50 border border-amber-500 rounded-lg p-4 mb-6 text-amber-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  You are not signed in. Please sign in to check your
                  authorization status.
                </span>
              </div>
            </div>
          )}

          {session && authStatus && (
            <div className="space-y-6">
              <div
                className={`p-5 rounded-lg border ${
                  authStatus.authorized
                    ? "bg-green-900/30 border-green-500"
                    : "bg-red-900/30 border-red-500"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {authStatus.authorized ? (
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <h2 className="text-xl font-bold">
                    {authStatus.authorized ? "Authorized" : "Not Authorized"}
                  </h2>
                </div>
                <p
                  className={
                    authStatus.authorized ? "text-green-300" : "text-red-300"
                  }
                >
                  {authStatus.message}
                </p>
              </div>

              {authStatus.mismatch && (
                <div className="bg-amber-900/30 border border-amber-500 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <svg
                      className="w-6 h-6 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 01-1-1v-3a1 1 0 112 0v3a1 1 0 01-1 1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h2 className="text-xl font-bold text-amber-300">
                      Session Mismatch Detected
                    </h2>
                  </div>
                  <p className="text-amber-300">
                    Your session authorization status doesn't match the status
                    in Firebase. Try signing out and back in to fix this issue.
                  </p>
                </div>
              )}

              <div className="bg-gray-700 p-5 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold mb-4">
                  Authorization Details
                </h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="font-medium w-48 text-gray-400">
                      User ID:
                    </span>
                    <span className="text-white font-mono">
                      {authStatus.userId}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-48 text-gray-400">
                      Username:
                    </span>
                    <span className="text-white">{authStatus.username}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-48 text-gray-400">
                      Firebase Value:
                    </span>
                    <span className="text-white font-mono">
                      {JSON.stringify(authStatus.firebaseValue)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-48 text-gray-400">
                      Session Authorized:
                    </span>
                    <span
                      className={`${
                        authStatus.sessionAuthorized
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {authStatus.sessionAuthorized ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-gray-400 mb-2">
                  If your authorization status is incorrect, please contact an
                  administrator or use the Discord bot command to update your
                  status.
                </p>
                <div className="bg-gray-700 p-3 rounded font-mono text-sm text-gray-300">
                  /authorize user_id:{authStatus.userId}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
