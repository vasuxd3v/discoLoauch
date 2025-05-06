"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AutoDmReplyStatus from "@/components/AutoDmReplyStatus";

export default function AutoDmReplyStatusPage() {
  const searchParams = useSearchParams();
  const [processId, setProcessId] = useState(null);

  useEffect(() => {
    // Get process ID from URL query params
    const id = searchParams.get("processId");
    if (id) {
      setProcessId(id);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Auto DM Reply Status</h1>
          <p className="text-gray-400">
            Monitor the status of your automatic DM replies
          </p>
        </div>

        {processId ? (
          <AutoDmReplyStatus processId={processId} />
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center">
              <p className="text-red-400 mb-4">No process ID provided</p>
              <a
                href="/tools/auto-dm-reply"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Auto DM Reply
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
