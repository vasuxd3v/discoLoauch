import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

// We'll reuse the same activeProcesses map from the main route
// In a production app, you'd use a database or Redis
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

    // Get user ID from session
    if (!session.user?.discord?.id) {
      return NextResponse.json(
        { error: "Discord ID not found" },
        { status: 401 }
      );
    }
    const userId = session.user.discord.id;

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

    return NextResponse.json({
      success: true,
      activeProcess: !!activeProcess,
      processId: processId,
    });
  } catch (error) {
    console.error("Error checking active Auto DM Reply process:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
