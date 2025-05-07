"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          Documentation
        </h1>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Getting Started
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Welcome to AutoXPulse documentation. Here you'll find everything you
            need to know about our powerful automation tools for social media
            management and Discord automation.
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            To get started, create an account by signing in with Discord. Once
            logged in, you'll need to be authorized to use the tools. You can
            request authorization using the Discord bot command{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              /authorize
            </code>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Auto Messager
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Schedule and send automated messages across multiple Discord
              channels at customizable intervals.
            </p>
            <Link
              href="/tools/auto-messager"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Auto Messager →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Auto Status Updater
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Automatically cycle through custom status messages on Discord at
              set intervals.
            </p>
            <Link
              href="/tools/auto-status-updater"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Auto Status Updater →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Auto DM Reply
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set up automatic replies for your Discord direct messages when
              you're away.
            </p>
            <Link
              href="/tools/auto-dm-reply"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Auto DM Reply →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            API Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            AutoXPulse provides a simple API for developers who want to
            integrate our automation capabilities into their own applications.
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            API documentation is currently available upon request. Contact us
            for more information.
          </p>
        </div>
      </div>
    </main>
  );
}
