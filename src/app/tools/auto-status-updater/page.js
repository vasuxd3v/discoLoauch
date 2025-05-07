"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoStatusUpdaterPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [statuses, setStatuses] = useState([{ content: "" }]);
  const [timeInterval, setTimeInterval] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingActiveProcess, setIsCheckingActiveProcess] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent(
          "/tools/auto-status-updater"
        )}`
      );
    }

    // Debug logging to verify session data
    if (status === "authenticated" && session) {
      console.log("Session data:", JSON.stringify(session));
      if (session.user?.image) {
        console.log("Avatar URL:", session.user.image);
        // Try to extract Discord ID from avatar URL
        const matches = session.user.image.match(/\/avatars\/(\d+)\//);
        if (matches && matches[1]) {
          console.log("Extracted Discord ID:", matches[1]);
        } else {
          console.log("Failed to extract Discord ID from avatar URL");
        }
      }
    }
  }, [status, router, session]);

  // Check if there's an active process when the component mounts
  useEffect(() => {
    const checkActiveProcess = async () => {
      try {
        setIsCheckingActiveProcess(true);
        const response = await fetch(
          "/api/tools/auto-status-updater/active-process"
        );

        // Check for authorization errors
        if (response.status === 401 || response.status === 403) {
          const data = await response.json();
          console.warn("Authorization issue:", data.error);
          setError("");
          setIsUnauthorized(true);
          setAuthMessage(
            data.error ||
              "You're not authorized to use this tool. Please contact the administrator."
          );
          setIsCheckingActiveProcess(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to check active processes");
        }

        const data = await response.json();
        if (data.success && data.hasActiveProcess) {
          // If there's an active process, redirect to its status page
          router.push(
            `/tools/auto-status-updater/status?processId=${data.processId}`
          );
          return;
        }
      } catch (err) {
        console.error("Error checking active process:", err);
        setError("Failed to connect to the server. Please try again later.");
      } finally {
        setIsCheckingActiveProcess(false);
      }
    };

    // Only check for active processes if user is authenticated
    if (status === "authenticated") {
      checkActiveProcess();
    } else if (status !== "loading") {
      setIsCheckingActiveProcess(false);
    }
  }, [router, status]);

  // Add a new status field
  const addStatus = () => {
    setStatuses([...statuses, { content: "" }]);
  };

  // Update a status at a specific index
  const updateStatus = (index, value) => {
    const updatedStatuses = [...statuses];
    updatedStatuses[index].content = value;
    setStatuses(updatedStatuses);
  };

  // Remove a status field
  const removeStatus = (index) => {
    if (statuses.length > 1) {
      const updatedStatuses = statuses.filter((_, i) => i !== index);
      setStatuses(updatedStatuses);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Debug session info
    if (session?.user) {
      console.log(
        "Submitting with session user:",
        JSON.stringify(session.user)
      );
    } else {
      console.log("No session user found");
    }

    // Validate inputs
    if (!discordToken) {
      setError("Discord token is required");
      setIsLoading(false);
      return;
    }

    if (
      statuses.length === 0 ||
      statuses.some((status) => !status.content.trim())
    ) {
      setError("At least one valid status message is required");
      setIsLoading(false);
      return;
    }

    if (!timeInterval || isNaN(timeInterval) || parseInt(timeInterval) < 1) {
      setError("Time interval must be a valid number greater than 0");
      setIsLoading(false);
      return;
    }

    try {
      // Extract status contents as strings
      const statusContents = statuses.map((s) => s.content);

      // Send request to start the Auto Status Updater
      const response = await fetch("/api/tools/auto-status-updater", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          discordToken,
          statuses: statusContents,
          timeInterval: parseInt(timeInterval),
          // Include user ID from session if available
          userId: session?.user?.id || session?.user?.discord?.id,
        }),
        credentials: "include", // Ensure cookies are sent with the request
      });

      // Handle unauthorized errors separately
      if (response.status === 401 || response.status === 403) {
        const data = await response.json();
        console.error("Authorization error:", data);
        setError(data.error || "Authorization failed. Please sign in again.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start Auto Status Updater");
      }

      if (data.success && data.processId) {
        // Redirect to status page with the process ID
        router.push(
          `/tools/auto-status-updater/status?processId=${data.processId}`
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error starting Auto Status Updater:", err);
      setError(err.message || "An unknown error occurred");
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking for active processes
  if (isCheckingActiveProcess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
            <p className="text-gray-300">Checking status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is not authorized
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700 text-center">
              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-red-800/30 p-5 rounded-full">
                  <svg
                    className="w-14 h-14 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 text-red-400">
                Access Restricted
              </h2>
              <p className="mb-4 text-gray-300">{authMessage}</p>

              <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-green-400 mb-2">
                  How to get access:
                </h3>
                <ul className="text-left text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 text-green-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Contact the administrator to request access to this tool
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 text-green-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verify your Discord account is properly connected
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 text-green-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Try signing out and back in
                  </li>
                </ul>
              </div>

              <a
                href="/profile"
                className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
                Go to your profile
              </a>
            </div>
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
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
                <path d="M12 7v4l3 3-1 1-3.12-3.12c-.1-.08-.19-.24-.19-.39V7h1.31z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Auto Status Updater</h1>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Discord Token Input */}
            <InputField
              label="Discord Token"
              id="discord-token"
              placeholder="Enter your Discord token"
              value={discordToken}
              onChange={(e) => setDiscordToken(e.target.value)}
              required
            />

            {/* Status Messages */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status Messages
              </label>
              <div className="space-y-3">
                {statuses.map((status, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={status.content}
                      onChange={(e) => updateStatus(index, e.target.value)}
                      placeholder="Enter a status message"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {statuses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStatus(index)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStatus}
                className="mt-3 flex items-center text-sm text-blue-400 hover:text-blue-300"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Status
              </button>
            </div>

            {/* Time Interval */}
            <InputField
              label="Time Interval (seconds)"
              id="time-interval"
              type="number"
              min="1"
              placeholder="60"
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value)}
              required
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6"
            >
              {isLoading ? (
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
                  Starting...
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  Start Auto Status Updater
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
