"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoMessagerPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [minDelay, setMinDelay] = useState("");
  const [maxDelay, setMaxDelay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingActiveProcess, setIsCheckingActiveProcess] = useState(true);
  const router = useRouter();

  // Check if the user has an active process on component mount
  useEffect(() => {
    async function checkActiveProcess() {
      try {
        const response = await fetch(
          "/api/tools/auto-messager?checkActive=true"
        );
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
      } finally {
        setIsCheckingActiveProcess(false);
      }
    }

    checkActiveProcess();
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Validate form
    if (
      !discordToken ||
      !channelId ||
      !messageContent ||
      !minDelay ||
      !maxDelay
    ) {
      setErrorMsg("All fields are required");
      setIsLoading(false);
      return;
    }

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
          channelId: channelId,
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

            {/* Channel ID Input */}
            <InputField
              label="Channel ID"
              id="channel-id"
              placeholder="Enter Discord channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              required
              helpText="The numerical ID of the Discord channel where messages will be sent."
            />

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
