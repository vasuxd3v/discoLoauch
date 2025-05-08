"use client";

import { Suspense } from "react";

/**
 * A reusable Suspense boundary component for wrapping pages
 * that use hooks requiring suspense (like useSearchParams in Next.js 15+)
 */
export function SuspenseBoundary({ children, fallback }) {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}
