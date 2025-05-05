"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { subscribeToUserData } from "@/lib/firebase/db";

export default function UserProfile() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.discord?.id) {
      const userId = session.user.discord.id;

      // Subscribe to user data from Firebase
      const unsubscribe = subscribeToUserData(userId, (data) => {
        setUserData(data);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  // Function to get Discord avatar URL
  const getDiscordAvatarUrl = (userId, avatarHash) => {
    if (!avatarHash) return "https://cdn.discordapp.com/embed/avatars/0.png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p className="text-gray-700 dark:text-gray-300">
          Please sign in to view your profile
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
          <Image
            src={
              userData?.avatar
                ? getDiscordAvatarUrl(session.user.discord.id, userData.avatar)
                : getDiscordAvatarUrl(
                    session.user.discord.id,
                    session.user.discord.avatar
                  )
            }
            alt="User avatar"
            fill
            className="object-cover"
          />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {userData?.username || session.user.discord.username}
        </h2>

        {userData?.email && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {userData.email}
          </p>
        )}

        <div className="w-full">
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Your Discord Servers
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {userData?.servers ? (
              userData.servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  {server.icon ? (
                    <Image
                      src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                      alt={server.name}
                      width={24}
                      height={24}
                      className="rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs mr-2">
                      {server.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {server.name}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No servers found
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Last login:{" "}
          {new Date(userData?.lastLogin || Date.now()).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
