import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AutoDmReplyStatus from "@/components/AutoDmReplyStatus";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";

function StatusContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const message = searchParams.get("message") || "";

  return (
    <div className="container mx-auto px-6 max-w-4xl py-28">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Auto-Reply Status
        </h1>

        {success ? (
          <div className="mb-6 bg-green-900/40 border border-green-600 rounded-lg p-4 text-green-200 flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="mt-1">
                {message || "Your auto-reply was updated."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-red-900/40 border border-red-600 rounded-lg p-4 text-red-200 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {error || "There was a problem with your request"}
              </p>
              <p className="mt-1">{message}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mt-8">
          <Link
            href="/tools/auto-dm-reply"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            Back to Auto-Reply
          </Link>
          <Link
            href="/tools"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
