"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

// Helper function to format tool type for display
const formatToolType = (toolType) => {
  return toolType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function MonitoringPage() {
  const { data: session, status } = useSession();
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActiveProcesses = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/monitoring/active-processes");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch active processes"
          );
        }

        const data = await response.json();

        if (data.success) {
          setActiveProcesses(data.processes);
        } else {
          throw new Error(data.error || "Failed to fetch active processes");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch active processes");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchActiveProcesses();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please sign in to view your active processes.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Active Processes
          </h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {activeProcesses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                No active processes found.
              </p>
              <Link
                href="/tools"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                View Available Tools
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {activeProcesses.map((process, idx) => (
                <div
                  key={process.processId || idx}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {formatToolType(process.toolType)}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Process ID: {process.processId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Started:{" "}
                        {process.startTime
                          ? new Date(process.startTime).toLocaleString()
                          : "Unknown"}
                      </p>
                      {process.stats && (
                        <div className="mt-2 space-y-1">
                          {process.stats.timeInterval !== undefined && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Update Interval: {process.stats.timeInterval}{" "}
                              seconds
                            </p>
                          )}
                          {process.stats.statuses && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Statuses: {process.stats.statuses.length}{" "}
                              configured
                            </p>
                          )}
                          {process.stats.repliesSent !== undefined && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Replies Sent: {process.stats.repliesSent}
                            </p>
                          )}
                          {process.stats.cooldown !== undefined && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Cooldown: {process.stats.cooldown} seconds
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {process.processId ? (
                      <Link
                        href={`/tools/${process.toolType}/status?processId=${process.processId}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        View Status
                      </Link>
                    ) : (
                      <span className="text-gray-400">No Status Available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
