import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  createStatusRotater,
  getStatusRotater,
  stopStatusRotater,
} from "@/lib/services/discordStatusService";
import { getAdminDb } from "@/lib/firebase/firebase-admin";
import {
  saveToolProcessAdmin,
  getUserToolProcessAdmin,
  updateToolProcessStatsAdmin,
  removeToolProcessAdmin,
} from "@/lib/firebase/firebase-admin";

// In-memory storage for active processes
// A more robust implementation would use a database
const activeProcesses = new Map();

// Define tool type constant
const TOOL_TYPE = "auto-status-updater";

// Helper function to check if user is authorized
async function isUserAuthorized(userId) {
  try {
    const db = getAdminDb();

    if (!userId) {
      return false;
    }

    const snapshot = await db.ref(`users/${userId}/authorized`).once("value");

    // Handle different possible true values (true, "true", 1) more flexibly
    const authValue = snapshot.val();
    return authValue === true || authValue === "true" || authValue === 1;
  } catch (error) {
    return false;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    // Enhanced user ID extraction with multiple fallback strategies
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

    // If we still don't have an ID, try to match the name with records in Firebase
    if (!userId && session.user.name) {
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
          }
        }
      } catch (error) {}
    }

    if (!userId) {
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

    try {
      // Get processId from query params
      const { searchParams } = new URL(request.url);
      const processId = searchParams.get("processId");

      if (!processId) {
        return NextResponse.json(
          { error: "Process ID is required" },
          { status: 400 }
        );
      }

      // Get process information
      const process = activeProcesses.get(processId);

      if (!process) {
        return NextResponse.json(
          { error: "Process not found", success: false },
          { status: 404 }
        );
      }

      // Get current status from the rotater
      const rotater = getStatusRotater(processId);
      const statusInfo = rotater ? rotater.getStatus() : null;

      // Return process status
      return NextResponse.json({
        success: true,
        status: {
          active: process.active,
          startTime: process.startTime,
          timeInterval: process.timeInterval,
          statuses: process.statuses,
          currentStatus: statusInfo?.currentStatus || null,
          totalUpdates: statusInfo?.totalUpdates || 0,
          lastUpdateTime: statusInfo?.lastUpdateTime || null,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Internal server error", success: false },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    // Read request body
    const body = await request.json();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    // Enhanced user ID extraction with multiple fallback strategies
    let userId = null;

    // First check for discord.id in the standard location
    if (session.user.discord?.id) {
      userId = session.user.discord.id;
    }
    // Then check if there's a regular id property
    else if (session.user.id) {
      userId = session.user.id;
    }
    // Check if userId was passed in the request body
    else if (body.userId) {
      userId = body.userId;
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
      } else {
      }
    } else {
    }

    // If we still don't have an ID, try to match the name with records in Firebase
    if (!userId && session.user.name) {
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
          } else {
          }
        } else {
        }
      } catch (error) {}
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Discord ID not found in session", success: false },
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

    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required", success: false },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case "start":
        return handleStart(body, { user: { ...session.user, id: userId } });
      case "stop":
        return handleStop(body);
      default:
        return NextResponse.json(
          { error: "Invalid action", success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}

// Handle starting a new Auto Status Updater process
async function handleStart(data, session) {
  const { discordToken, statuses, timeInterval } = data;

  // Validate required fields
  if (!discordToken || !statuses || !timeInterval) {
    return NextResponse.json(
      {
        error: "Discord token, statuses, and time interval are required",
        success: false,
      },
      { status: 400 }
    );
  }

  // Validate statuses format
  if (
    !Array.isArray(statuses) ||
    statuses.length === 0 ||
    statuses.some((s) => !s || typeof s !== "string")
  ) {
    return NextResponse.json(
      { error: "Invalid statuses format", success: false },
      { status: 400 }
    );
  }

  try {
    // Get user ID with multiple fallbacks
    const userId = session.user?.id || session.user?.discord?.id || data.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Discord user ID not found", success: false },
        { status: 401 }
      );
    }

    // Check Firebase first for existing active process
    const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
    if (storedProcess && storedProcess.active) {
      return NextResponse.json(
        {
          error: "You already have an active Auto Status Updater process",
          success: false,
          processId: storedProcess.processId,
        },
        { status: 400 }
      );
    }

    // Also check memory for any active processes for this user
    for (const process of activeProcesses.values()) {
      if (process.userId === userId && process.active) {
        return NextResponse.json(
          {
            error: "You already have an active Auto Status Updater process",
            success: false,
            processId: Array.from(activeProcesses.entries()).find(
              ([_, proc]) => proc.userId === userId && proc.active
            )?.[0],
          },
          { status: 400 }
        );
      }
    }

    // Create a new process using the status rotater service
    const processId = createStatusRotater(
      discordToken,
      statuses,
      parseInt(timeInterval)
    );

    // Store process information
    const process = {
      userId,
      active: true,
      startTime: new Date().toISOString(),
      discordToken,
      statuses,
      timeInterval: parseInt(timeInterval),
    };

    // Store in memory
    activeProcesses.set(processId, process);

    // Store in Firebase (removing sensitive data like token)
    const processForStorage = {
      active: true,
      startTime: process.startTime,
      statuses,
      timeInterval: parseInt(timeInterval),
      processId,
    };

    await saveToolProcessAdmin(userId, TOOL_TYPE, processId, processForStorage);

    // Send success response
    return NextResponse.json({
      success: true,
      processId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start Auto Status Updater", success: false },
      { status: 500 }
    );
  }
}

// Handle stopping an existing Auto Status Updater process
async function handleStop(data) {
  const { processId } = data;

  // Validate process ID
  if (!processId) {
    return NextResponse.json(
      { error: "Process ID is required", success: false },
      { status: 400 }
    );
  }

  // Get process
  const process = activeProcesses.get(processId);

  if (!process) {
    // Check if process exists in Firebase
    const storedProcess = await getUserToolProcessAdmin(
      process.userId,
      TOOL_TYPE
    );
    if (storedProcess && storedProcess.processId === processId) {
      // Update Firebase to mark process as inactive
      await updateToolProcessStatsAdmin(process.userId, TOOL_TYPE, {
        active: false,
      });

      return NextResponse.json({
        success: true,
        message: "Process stopped in database",
        status: {
          active: false,
          startTime: storedProcess.startTime,
          statuses: storedProcess.statuses,
          timeInterval: storedProcess.timeInterval,
        },
      });
    }

    return NextResponse.json(
      { error: "Process not found", success: false },
      { status: 404 }
    );
  }

  try {
    // Stop the status rotater
    stopStatusRotater(processId);

    // Update process status
    process.active = false;
    activeProcesses.set(processId, process);

    // Update Firebase
    await updateToolProcessStatsAdmin(process.userId, TOOL_TYPE, {
      active: false,
    });

    // Send success response
    return NextResponse.json({
      success: true,
      status: {
        active: false,
        startTime: process.startTime,
        statuses: process.statuses,
        timeInterval: process.timeInterval,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to stop Auto Status Updater", success: false },
      { status: 500 }
    );
  }
}
