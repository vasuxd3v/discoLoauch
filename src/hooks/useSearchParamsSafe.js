"use client";

import { useSearchParams as useNextSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * A safer version of useSearchParams that works client-side only
 * without requiring Suspense boundaries
 *
 * @returns {URLSearchParams | null} The search params object or null while loading
 */
export function useSearchParamsSafe() {
  const [searchParams, setSearchParams] = useState(null);
  //Only update search params on the client
  const [isClient, setIsClient] = useState(false);

  // Always run this effect to set isClient
  useEffect(() => {
    // Only run in the browser
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // Return our state on the server
  return searchParams;
}
