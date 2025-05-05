"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserProfile from "@/components/UserProfile";

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
        Your Profile
      </h1>

      <div className="max-w-3xl mx-auto">
        <UserProfile />

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Management
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
                Data Syncing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your Discord profile data is automatically synced with our
                database when you log in. All changes to your Discord profile
                will be reflected here on your next login.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
                Data Privacy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We only store basic information about your Discord account
                (username, avatar, server list). You can request deletion of
                your data at any time by contacting support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
