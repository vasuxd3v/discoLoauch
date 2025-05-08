"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import AutoDmReplyStatus from "@/components/AutoDmReplyStatus";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function StatusContent() {
  const searchParams = useSearchParams();
  const processId = searchParams.get("processId");

  if (!processId) {
    return (
      <div className="container mx-auto px-6 max-w-4xl py-28">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-white">
            Auto-Reply Status
          </h1>

          <div className="mb-6 bg-red-900/40 border border-red-600 rounded-lg p-4 text-red-200 flex items-start">
            <div>
              <p className="font-medium">Missing Process ID</p>
              <p className="mt-1">No process ID was provided in the URL.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 max-w-4xl py-28">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Auto-Reply Status
        </h1>

        {/* Using the AutoDmReplyStatus component to show real-time status */}
        <AutoDmReplyStatus processId={processId} />
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        }
      >
        <StatusContent />
      </Suspense>
    </div>
  );
}
