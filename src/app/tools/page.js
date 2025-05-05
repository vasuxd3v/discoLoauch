"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ToolsPage() {
  const router = useRouter();

  const tools = [
    {
      id: "auto-messager",
      name: "Auto Messager",
      description:
        "Schedule and send automated messages across multiple channels.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
        </svg>
      ),
    },
    {
      id: "auto-replier",
      name: "Auto Replier",
      description: "Intelligent response system that handles common inquiries.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path>
        </svg>
      ),
    },
    {
      id: "auto-dm-reply",
      name: "Auto DM Reply",
      description:
        "Never miss a direct message again with automatic DM replies.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"></path>
        </svg>
      ),
    },
  ];

  const handleToolClick = (toolId) => {
    router.push(`/tools/${toolId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
          AutoXPulse Tools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 text-blue-600 dark:text-blue-400">
                  {tool.icon}
                </div>

                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  {tool.name}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                  {tool.description}
                </p>

                <button
                  className="mt-auto w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  aria-label={`Use ${tool.name}`}
                >
                  Use Tool
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
