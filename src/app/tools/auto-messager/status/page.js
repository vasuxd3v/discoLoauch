"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AutoMessagerStatus from "@/components/AutoMessagerStatus";

export default function AutoMessagerStatusPage() {
  const searchParams = useSearchParams();
  const processId = searchParams.get("processId");
  const router = useRouter();

  // Redirect to main page if no process ID is provided
  useEffect(() => {
    if (!processId) {
      router.push("/tools/auto-messager");
    }
  }, [processId, router]);

  if (!processId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <AutoMessagerStatus processId={processId} />
      </div>
    </div>
  );
}
