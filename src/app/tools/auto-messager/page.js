"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import InputField from "@/components/InputField";

export default function AutoMessagerPage() {
  const [discordToken, setDiscordToken] = useState("");
  const [channels, setChannels] = useState([{ id: "", value: "" }]);
  const [messageContent, setMessageContent] = useState("");
  const [minDelay, setMinDelay] = useState("");
  const [maxDelay, setMaxDelay] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle adding a new channel input
  const handleAddChannel = () => {
    setChannels([...channels, { id: `channel-${Date.now()}`, value: "" }]);
  };

  // Handle channel input changes
  const handleChannelChange = (index, value) => {
    const updatedChannels = [...channels];
    updatedChannels[index].value = value;
    setChannels(updatedChannels);
  };

  // Handle removing a channel input
  const handleRemoveChannel = (index) => {
    if (channels.length > 1) {
      const updatedChannels = [...channels];
      updatedChannels.splice(index, 1);
      setChannels(updatedChannels);
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
        channels: channels.map((channel) => channel.value),
        messageContent,
        delayRange: { min: minDelay, max: maxDelay },
      });
      setIsLoading(false);
      // Here you would normally send the data to your backend
      alert("Auto Messager started successfully!");
    }, 1500);
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

            {/* Channel ID Inputs with Add Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Channel ID <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddChannel}
                  className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full w-7 h-7 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Add another channel"
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

              {channels.map((channel, index) => (
                <div key={channel.id} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Discord channel ID"
                    value={channel.value}
                    onChange={(e) => handleChannelChange(index, e.target.value)}
                    required
                    className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {channels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChannel(index)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3"
                      aria-label="Remove channel"
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
                The numerical ID of the Discord channel where messages will be
                sent.
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
                  min="0"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  required
                  min="0"
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
