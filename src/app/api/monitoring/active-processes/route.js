import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminDb } from "@/lib/firebase/firebase-admin";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    // Get user ID with multiple fallback strategies
    let userId = null;

    // First check for discord.id in the standard location
    if (session.user.discord?.id) {
      userId = session.user.discord.id;
    }
    // Then check if there's a regular id property
    else if (session.user.id) {
      userId = session.user.id;
    }
    // Try to extract from the image URL if it's a Discord CDN URL
    else if (
      session.user.image &&
      session.user.image.includes("cdn.discordapp.com/avatars/")
    ) {
      // Extract ID from URL format: https://cdn.discordapp.com/avatars/{USER_ID}/{AVATAR_HASH}.png
      const matches = session.user.image.match(/\/avatars\/(\d+)\//);
      if (matches && matches[1]) {
        userId = matches[1];
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Discord ID not found in session", success: false },
        { status: 401 }
      );
    }

    const db = getAdminDb();

    // Get all tool processes for the user
    const snapshot = await db.ref(`toolProcesses/${userId}`).once("value");
    const processes = [];

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Iterate through each tool type
      for (const [toolType, processData] of Object.entries(data)) {
        if (processData.active) {
          processes.push({
            toolType,
            processId: processData.processId,
            startTime: processData.startTime,
            stats: {
              timeInterval: processData.timeInterval,
              statuses: processData.statuses,
              repliesSent: processData.repliesSent,
              cooldown: processData.cooldown,
            },
          });
        }
      }
    }

    // Filter out any process without a valid processId
    const filteredProcesses = processes.filter((p) => p.processId);

    return NextResponse.json({
      success: true,
      processes: filteredProcesses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch active processes", success: false },
      { status: 500 }
    );
  }
}
