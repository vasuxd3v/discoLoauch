"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function ToolsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  const isAuthorized = session?.user?.authorized === true;

  const tools = [
    {
      id: "auto-messager",
      name: "Auto Messager",
      description:
        "Schedule and send automated messages across multiple channels at customizable intervals.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
        </svg>
      ),
      features: [
        "Multiple channel support",
        "Randomized delay between messages",
        "Real-time monitoring",
        "Automatic retry on rate limits",
      ],
      bgcolor: "from-blue-500 to-indigo-600",
    },
    {
      id: "auto-status-updater",
      name: "Auto Status Updater",
      description:
        "Automatically cycle through custom status messages on Discord at set intervals.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"></path>
          <path d="M12 7v4l3 3-1 1-3.12-3.12c-.1-.08-.19-.24-.19-.39V7h1.31z"></path>
        </svg>
      ),
      features: [
        "Custom status rotation",
        "Emoji support",
        "Scheduled activation",
        "Activity type selection",
      ],
      bgcolor: "from-purple-500 to-pink-600",
    },
    {
      id: "auto-dm-reply",
      name: "Auto DM Reply",
      description:
        "Never miss a direct message again with automatic DM replies when you're away.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"></path>
        </svg>
      ),
      features: [
        "Customizable reply messages",
        "Away mode scheduling",
        "Message filtering options",
        "Reply only to new conversations",
      ],
      bgcolor: "from-teal-500 to-emerald-600",
    },
  ];

  const handleToolClick = (tool) => {
    const toolPath = `/tools/${tool.id}`;
    if (!session) {
      // User is not authenticated, show login modal
      setSelectedTool(tool);
      setShowLoginModal(true);
    } else if (!isAuthorized) {
      // User is authenticated but not authorized
      alert(
        "You are not authorized to use this tool. Please contact the administrator."
      );
    } else {
      // User is authenticated and authorized, redirect to the tool
      router.push(toolPath);
    }
  };

  const handleLogin = () => {
    const toolPath = selectedTool ? `/tools/${selectedTool.id}` : "/tools";
    signIn("discord", { callbackUrl: toolPath });
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setSelectedTool(null);
  };

  // Show loading state while checking authentication
  if (status === "loading") {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-3 text-center text-gray-800 dark:text-white">
            AutoXPulse Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 text-center max-w-3xl mx-auto">
            Powerful automation tools to enhance your Discord experience and
            streamline your online presence.
          </p>

          {session && !isAuthorized && (
            <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-800 dark:border-yellow-600 dark:text-yellow-200 rounded">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
                <span className="font-medium">Authorization Required</span>
              </div>
              <p className="mt-2">
                Your account is not authorized to use these tools. Please
                contact the administrator or use the Discord bot{" "}
                <code className="bg-yellow-200 dark:bg-yellow-900 px-1 py-0.5 rounded">
                  /authorize
                </code>{" "}
                command to gain access.
              </p>
            </div>
          )}

          {/* Tools Grid */}
          <div className="space-y-12">
            {tools.map((tool, index) => (
              <div
                key={tool.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  session && !isAuthorized ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Tool Info */}
                  <div className="md:w-1/2 p-8">
                    <div
                      className={`inline-flex p-3 rounded-full bg-gradient-to-r ${tool.bgcolor} text-white mb-4`}
                    >
                      {tool.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                      {tool.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {tool.description}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {tool.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center text-gray-600 dark:text-gray-300"
                        >
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleToolClick(tool)}
                      className={`mt-auto py-3 px-6 rounded-lg transition-all focus:ring-2 focus:ring-blue-300 focus:outline-none ${
                        session && !isAuthorized
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : `bg-gradient-to-r ${tool.bgcolor} text-white hover:shadow-lg`
                      }`}
                      aria-label={`Use ${tool.name}`}
                      disabled={session && !isAuthorized}
                    >
                      {session && !isAuthorized ? "Unauthorized" : "Use Tool"}
                    </button>
                  </div>

                  {/* Tool Visual/Screenshot */}
                  <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-center">
                    <div className="rounded-lg shadow-lg bg-white dark:bg-gray-900 p-4 w-full max-w-sm h-64 flex flex-col border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {tool.name}
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="flex-grow flex flex-col justify-center items-center text-center px-3">
                        <div
                          className={`w-14 h-14 rounded-full bg-gradient-to-r ${tool.bgcolor} flex items-center justify-center mb-3`}
                        >
                          <div className="transform scale-75 text-white">
                            {tool.icon}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          Configure and manage your {tool.name.toLowerCase()}{" "}
                          settings
                        </p>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                        <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Login Required
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be logged in to use the{" "}
              {selectedTool ? selectedTool.name : "tools"}. Please log in with
              your Discord account to continue.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.516.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"></path>
                </svg>
                Sign in with Discord
              </button>
              <button
                onClick={closeModal}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
