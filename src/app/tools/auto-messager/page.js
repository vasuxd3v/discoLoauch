"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoMessagerPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [channelIds, setChannelIds] = useState([{ id: "", key: "initial" }]);
  const [messageContent, setMessageContent] = useState("");
  const [minDelay, setMinDelay] = useState("");
  const [maxDelay, setMaxDelay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingActiveProcess, setIsCheckingActiveProcess] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Initialize keys for channelIds after component mounts to avoid hydration mismatch
  useEffect(() => {
    setChannelIds([{ id: "", key: Date.now().toString() }]);
  }, []);

  // Add a new channel ID field
  const addChannelId = () => {
    setChannelIds([...channelIds, { id: "", key: Date.now().toString() }]);
  };

  // Handle channel ID change
  const handleChannelIdChange = (index, value) => {
    const updatedChannelIds = [...channelIds];
    updatedChannelIds[index].id = value;
    setChannelIds(updatedChannelIds);
  };

  // Remove a channel ID field
  const removeChannelId = (index) => {
    if (channelIds.length > 1) {
      const updatedChannelIds = [...channelIds];
      updatedChannelIds.splice(index, 1);
      setChannelIds(updatedChannelIds);
    }
  };

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent("/tools/auto-messager")}`
      );
    }
  }, [status, router]);

  // Check if the user has an active process on component mount
  useEffect(() => {
    async function checkActiveProcess() {
      try {
        setIsCheckingActiveProcess(true);
        const response = await fetch(
          "/api/tools/auto-messager?checkActive=true"
        );

        if (response.status === 401 || response.status === 403) {
          // Handle authorization issues
          const data = await response.json();
          console.warn("Authorization issue:", data.error);
          setErrorMsg("");
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
          // Redirect to the active process status page
          router.push(
            `/tools/auto-messager/status?processId=${data.activeProcessId}`
          );
        }
      } catch (error) {
        console.error("Error checking active processes:", error);
        setErrorMsg("Failed to connect to the server. Please try again later.");
      } finally {
        setIsCheckingActiveProcess(false);
      }
    }

    // Only check for active processes if user is authenticated
    if (status === "authenticated") {
      checkActiveProcess();
    }
  }, [router, status]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Validate form
    if (!discordToken || !messageContent || !minDelay || !maxDelay) {
      setErrorMsg("All fields are required");
      setIsLoading(false);
      return;
    }

    // Validate channel IDs
    const filteredChannelIds = channelIds.filter(
      (channel) => channel.id.trim() !== ""
    );
    if (filteredChannelIds.length === 0) {
      setErrorMsg("At least one channel ID is required");
      setIsLoading(false);
      return;
    }

    // Extract the channel IDs from the array of objects
    const channelIdArray = filteredChannelIds.map((channel) =>
      channel.id.trim()
    );

    // Validate delay range
    const minDelayNum = parseInt(minDelay);
    const maxDelayNum = parseInt(maxDelay);
    if (
      isNaN(minDelayNum) ||
      isNaN(maxDelayNum) ||
      minDelayNum <= 0 ||
      maxDelayNum <= 0
    ) {
      setErrorMsg("Delay values must be positive numbers");
      setIsLoading(false);
      return;
    }

    if (minDelayNum >= maxDelayNum) {
      setErrorMsg("Maximum delay must be greater than minimum delay");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/tools/auto-messager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          token: discordToken,
          channelIds: channelIdArray,
          message: messageContent,
          minDelay: minDelayNum,
          maxDelay: maxDelayNum,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start auto-messager");
      }

      const data = await response.json();

      if (data.success && data.processId) {
        // Redirect to status page with process ID
        router.push(`/tools/auto-messager/status?processId=${data.processId}`);
      } else {
        setErrorMsg("Unknown error starting auto-messager");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error starting auto-messager:", err);
      setErrorMsg(err.message || "Failed to start auto-messager");
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
                <h3 className="font-medium text-blue-400 mb-2">
                  How to get access:
                </h3>
                <ul className="text-left text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-400 mt-0.5"
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
                      className="w-5 h-5 mr-2 text-blue-400 mt-0.5"
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
                      className="w-5 h-5 mr-2 text-blue-400 mt-0.5"
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
                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Auto Messager</h1>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              <p>{errorMsg}</p>
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

            {/* Channel IDs Input */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Channel ID(s) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {channelIds.map((channel, index) => (
                  <div key={channel.key} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter Discord channel ID"
                      value={channel.id}
                      onChange={(e) =>
                        handleChannelIdChange(index, e.target.value)
                      }
                      required={index === 0}
                      className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {channelIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChannelId(index)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-full"
                        aria-label="Remove channel"
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
                    {index === channelIds.length - 1 && (
                      <button
                        type="button"
                        onClick={addChannelId}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full"
                        aria-label="Add another channel"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                The numerical ID(s) of the Discord channel(s) where messages
                will be sent.
              </p>
            </div>

            {/* Message Content */}
            <InputField
              label="Message Content"
              id="message-content"
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              required
              isTextarea={true}
              rows={6}
            />

            {/* Delay Range */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                Delay Range (seconds) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minDelay}
                  onChange={(e) => setMinDelay(e.target.value)}
                  required
                  min="1"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  required
                  min="1"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                The minimum and maximum delay between messages (in seconds).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  Start Auto Messenger
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
