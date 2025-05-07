"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AutoStatusUpdaterStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processId = searchParams.get("processId");

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stoppingProcess, setStoppingProcess] = useState(false);

  // Fetch status on load and periodically
  useEffect(() => {
    if (!processId) {
      router.push("/tools/auto-status-updater");
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/tools/auto-status-updater?processId=${processId}`
        );

        if (response.status === 404) {
          setError("Process not found. It may have been stopped or expired.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const data = await response.json();
        if (data.success) {
          setStatus(data.status);

          // If process is not active anymore, stop polling
          if (!data.status.active) {
            clearInterval(statusInterval);
          }
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        console.error("Error fetching status:", err);
        setError(err.message || "Failed to fetch status");
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Set up interval for polling
    const statusInterval = setInterval(fetchStatus, 5000);

    // Clean up on unmount
    return () => clearInterval(statusInterval);
  }, [processId, router]);

  // Stop the Auto Status Updater process
  const handleStop = async () => {
    setStoppingProcess(true);
    try {
      const response = await fetch("/api/tools/auto-status-updater", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop",
          processId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop Auto Status Updater");
      }

      // Update status after successful stop
      setStatus(data.status);
    } catch (err) {
      console.error("Error stopping Auto Status Updater:", err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setStoppingProcess(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (startTime) => {
    if (!startTime) return "N/A";

    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;

    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Go back to input form (only if process is stopped)
  const handleNewProcess = async () => {
    // Check if there's an active process before going back
    try {
      const response = await fetch(
        "/api/tools/auto-status-updater/active-process"
      );
      const data = await response.json();

      // If there's still an active process, don't allow going back to the input page
      if (data.success && data.hasActiveProcess) {
        // If it's the same process, refresh this page
        if (data.processId === processId) {
          window.location.reload();
        } else {
          // If it's a different process, redirect to that process's status page
          router.push(
            `/tools/auto-status-updater/status?processId=${data.processId}`
          );
        }
      } else {
        // Only go back to the input page if there's no active process
        router.push("/tools/auto-status-updater");
      }
    } catch (err) {
      console.error("Error checking active processes:", err);
      // If error checking, default to not allowing navigation back
      setError("Failed to check active processes. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
                <path d="M12 7v4l3 3-1 1-3.12-3.12c-.1-.08-.19-.24-.19-.39V7h1.31z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Auto Status Updater Status</h1>
          </div>

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

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="flex flex-col items-center">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
                <p className="text-gray-400">Loading status...</p>
              </div>
            </div>
          ) : status ? (
            <div>
              <div className="flex items-center mb-6">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    status.active ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <span className="font-medium text-lg">
                  {status.active ? "Active" : "Stopped"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Running time</p>
                  <p className="text-xl font-mono mt-1">
                    {formatDuration(status.startTime)}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Started at</p>
                  <p className="text-xl font-mono mt-1">
                    {formatTimestamp(status.startTime)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-400">Status update interval</p>
                <p className="text-xl mt-1">{status.timeInterval} seconds</p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-400">Status messages</p>
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                    {status.statuses?.length || 0} messages
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {status.statuses?.map((statusText, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        status.currentStatus === statusText
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      {statusText}
                      {status.currentStatus === statusText && (
                        <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {status.totalUpdates > 0 && (
                <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-400">Status updates</p>
                  <div className="flex items-center mt-1">
                    <p className="text-xl">{status.totalUpdates}</p>
                    <span className="ml-2 text-sm text-gray-400">
                      (Last update: {formatTimestamp(status.lastUpdateTime)})
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                {status.active ? (
                  <button
                    onClick={handleStop}
                    disabled={stoppingProcess}
                    className="flex items-center justify-center py-3 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {stoppingProcess ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Stopping...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                        Stop Auto Status Updater
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNewProcess}
                    className="flex items-center justify-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                    Start New Process
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                Process not found. It may have expired or been deleted.
              </p>
              <button
                onClick={handleNewProcess}
                className="mt-4 inline-flex items-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  ></path>
                </svg>
                Back to Auto Status Updater
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
