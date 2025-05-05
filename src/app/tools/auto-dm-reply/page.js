"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoDmReplyPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [replyToAllDms, setReplyToAllDms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log({
        discordToken,
        messageContent,
        cooldown,
        blacklist: blacklist ? blacklist.split(",").map((id) => id.trim()) : [],
        replyToAllDms,
      });
      setIsLoading(false);
      // Here you would normally send the data to your backend
      alert("Auto DM Reply started successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Auto DM Reply</h1>
          </div>

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

            {/* Message Content */}
            <InputField
              label="Message Content"
              id="message-content"
              placeholder="Type your automatic DM reply here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              required
              isTextarea={true}
              rows={6}
            />

            {/* Cooldown */}
            <InputField
              label="Cooldown (seconds)"
              id="cooldown"
              type="number"
              placeholder="60"
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              required
            />

            {/* User Blacklist */}
            <InputField
              label="User Blacklist (comma-separated user IDs)"
              id="blacklist"
              placeholder="123456789012345678,987654321098765432"
              value={blacklist}
              onChange={(e) => setBlacklist(e.target.value)}
            />

            {/* Reply to All DMs Checkbox */}
            <div className="flex items-center">
              <input
                id="reply-all"
                type="checkbox"
                checked={replyToAllDms}
                onChange={(e) => setReplyToAllDms(e.target.checked)}
                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-700 rounded"
              />
              <label htmlFor="reply-all" className="ml-3 text-sm text-gray-300">
                Reply to all DMs (if unchecked, will only reply to new
                conversations)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mt-6"
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
                  Start Auto DM Reply
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
