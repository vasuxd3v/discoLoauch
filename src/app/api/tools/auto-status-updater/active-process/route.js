import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// Import from parent route to access the same activeProcesses map
import { activeProcesses } from "../active-processes";

// Helper function to check if user is authorized
async function isUserAuthorized(userId) {
  try {
    const db = getAdminDb();
    const snapshot = await db.ref(`users/${userId}/authorized`).once("value");
    return snapshot.val() === true;
  } catch (error) {
    console.error("Error checking user authorization:", error);
    return false;
  }
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enhanced user ID extraction with multiple fallback strategies
    let userId = null;

    // First check for discord.id in the standard location
    if (session.user?.discord?.id) {
      userId = session.user.discord.id;
      console.log(`Using standard discord.id: ${userId}`);
    }
    // Then check if there's a regular id property
    else if (session.user?.id) {
      userId = session.user.id;
      console.log(`Using session.user.id: ${userId}`);
    }
    // Try to extract from the image URL if it's a Discord CDN URL
    else if (
      session.user?.image &&
      session.user.image.includes("cdn.discordapp.com/avatars/")
    ) {
      // Extract ID from URL format: https://cdn.discordapp.com/avatars/{USER_ID}/{AVATAR_HASH}.png
      const matches = session.user.image.match(/\/avatars\/(\d+)\//);
      if (matches && matches[1]) {
        userId = matches[1];
        console.log(`Extracted Discord ID from avatar URL: ${userId}`);
      }
    }

    // If we still don't have an ID, try to match the name with records in Firebase
    if (!userId && session.user?.name) {
      try {
        const db = getAdminDb();
        const usersSnapshot = await db.ref("users").once("value");
        const users = usersSnapshot.val();

        if (users) {
          // Find user with matching username
          const matchingUserEntry = Object.entries(users).find(
            ([_, userData]) => userData.username === session.user.name
          );

          if (matchingUserEntry) {
            userId = matchingUserEntry[0];
            console.log(
              `Found user ID ${userId} matching username ${session.user.name} in Firebase`
            );
          }
        }
      } catch (error) {
        console.error("Error searching for user by name:", error);
      }
    }

    if (!userId) {
      console.error("No user ID found in session:", session.user);
      return NextResponse.json(
        { error: "Discord ID not found in session" },
        { status: 401 }
      );
    }

    // Check if user is authorized
    const authorized = await isUserAuthorized(userId);
    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to use this tool. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    // Find any active process for this user
    let activeProcess = null;
    let processId = null;

    for (const [id, process] of activeProcesses.entries()) {
      if (process.userId === userId && process.active) {
        activeProcess = process;
        processId = id;
        break;
      }
    }

    if (!activeProcess) {
      return NextResponse.json({
        success: true,
        hasActiveProcess: false,
      });
    }

    // Return active process info
    return NextResponse.json({
      success: true,
      hasActiveProcess: true,
      processId,
    });
  } catch (error) {
    console.error("Error checking active process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
