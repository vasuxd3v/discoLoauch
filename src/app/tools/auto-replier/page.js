"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoReplierPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [servers, setServers] = useState([{ id: "server-1", value: "" }]);
  const [triggerWords, setTriggerWords] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle adding a new server input
  const handleAddServer = () => {
    setServers([...servers, { id: `server-${Date.now()}`, value: "" }]);
  };

  // Handle server input changes
  const handleServerChange = (index, value) => {
    const updatedServers = [...servers];
    updatedServers[index].value = value;
    setServers(updatedServers);
  };

  // Handle removing a server input
  const handleRemoveServer = (index) => {
    if (servers.length > 1) {
      const updatedServers = [...servers];
      updatedServers.splice(index, 1);
      setServers(updatedServers);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log({
        discordToken,
        servers: servers.map((server) => server.value),
        triggerWords: triggerWords.split(",").map((word) => word.trim()),
        replyContent,
        cooldown,
      });
      setIsLoading(false);
      // Here you would normally send the data to your backend
      alert("Auto Replier started successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Auto Replier</h1>
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

            {/* Server ID Inputs with Add Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Server ID <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddServer}
                  className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-7 h-7 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Add another server"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>

              {servers.map((server, index) => (
                <div key={server.id} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Discord server ID"
                    value={server.value}
                    onChange={(e) => handleServerChange(index, e.target.value)}
                    required
                    className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {servers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveServer(index)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3"
                      aria-label="Remove server"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">
                The numerical ID of the Discord server where the bot will listen
                for messages.
              </p>
            </div>

            {/* Trigger Words */}
            <InputField
              label="Trigger Words (comma-separated)"
              id="trigger-words"
              placeholder="hello, hi, hey, what's up"
              value={triggerWords}
              onChange={(e) => setTriggerWords(e.target.value)}
              required
            />

            {/* Reply Message Content */}
            <InputField
              label="Reply Message Content"
              id="reply-content"
              placeholder="Type your automatic reply here..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              required
              isTextarea={true}
              rows={6}
            />

            {/* Cooldown */}
            <InputField
              label="Cooldown (seconds)"
              id="cooldown"
              type="number"
              placeholder="30"
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              required
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  Start Auto Replier
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
