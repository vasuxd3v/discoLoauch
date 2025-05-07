import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminDb } from "@/lib/firebase/firebase-admin";
import {
  saveToolProcessAdmin,
  getUserToolProcessAdmin,
  updateToolProcessStatsAdmin,
  removeToolProcessAdmin,
} from "@/lib/firebase/firebase-admin";

// Map to store active messaging processes by user ID and process ID
const activeProcesses = new Map();
// Map to store interval IDs for message sending
const messageIntervals = new Map();

// Define tool type constant
const TOOL_TYPE = "auto-messager";

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

// Function to send a message to Discord
async function sendMessageToDiscord(token, channelId, message) {
  try {
    const response = await fetch(
      `https://discord.com/api/v9/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
        },
        body: JSON.stringify({
          content: message,
        }),
      }
    );

    if (response.ok) {
      console.log(`Message sent to channel ${channelId}`);
      return { success: true };
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter =
        parseInt(response.headers.get("retry-after") || "5") * 1000;
      console.log(`Rate limited. Retrying after ${retryAfter}ms`);
      return {
        success: false,
        rateLimited: true,
        retryAfter,
      };
    }

    const errorData = await response.json().catch(() => ({}));
    console.error("Discord API error:", response.status, errorData);
    return {
      success: false,
      error: `API Error: ${response.status}`,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Function to start the messaging process
function startMessagingProcess(userId, processId) {
  if (
    !activeProcesses.has(userId) ||
    !activeProcesses.get(userId).has(processId)
  ) {
    return;
  }

  const process = activeProcesses.get(userId).get(processId);

  // Function to send a message to all channels and schedule the next one
  const sendAndScheduleNext = async () => {
    if (!process.active) {
      // Stop if the process is no longer active
      clearTimeout(messageIntervals.get(`${userId}-${processId}`));
      messageIntervals.delete(`${userId}-${processId}`);
      return;
    }

    // Send messages to all channels
    let allSuccess = true;
    let rateLimited = false;
    let retryAfter = 0;
    let lastError = null;

    // Iterate through all channel IDs
    for (const channelId of process.channelIds) {
      const result = await sendMessageToDiscord(
        process.token,
        channelId,
        process.message
      );

      if (!result.success) {
        allSuccess = false;

        if (result.rateLimited) {
          rateLimited = true;
          retryAfter = Math.max(retryAfter, result.retryAfter);
        } else {
          lastError = result.error;
        }
      }
    }

    if (allSuccess) {
      process.messagesSent++;

      // Update Firebase with new message count and active state
      await updateToolProcessStatsAdmin(userId, TOOL_TYPE, {
        messagesSent: process.messagesSent,
        active: process.active,
      });

      // Calculate random delay for next message
      const delayMs =
        Math.floor(
          Math.random() * (process.maxDelay - process.minDelay + 1) +
            process.minDelay
        ) * 1000; // Convert to milliseconds

      // Schedule next message
      const timeoutId = setTimeout(sendAndScheduleNext, delayMs);
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    } else if (rateLimited) {
      // If rate limited, try again after the specified delay
      const timeoutId = setTimeout(sendAndScheduleNext, retryAfter);
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    } else {
      // If there was an error, try again after a default delay
      process.lastError = lastError;
      const timeoutId = setTimeout(sendAndScheduleNext, 10000); // 10 seconds retry
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    }
  };

  // Start the messaging process
  sendAndScheduleNext();
}

export async function POST(request) {
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
      console.log(`Using standard discord.id: ${userId}`);
    }
    // Then check if there's a regular id property
    else if (session.user.id) {
      userId = session.user.id;
      console.log(`Using session.user.id: ${userId}`);
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
        console.log(`Extracted Discord ID from avatar URL: ${userId}`);
      }
    }

    if (!userId) {
      console.error("No user ID found in session:", session.user);
      return NextResponse.json(
        { error: "Discord ID not found in session", success: false },
        { status: 401 }
      );
    }

    // Check if user is authorized - always authorize if authorized property is in session
    let authorized = false;

    if (session.user.authorized !== undefined) {
      // Use the value from the session if available
      authorized = session.user.authorized;
      console.log(
        `Using authorization from session for ${userId}: ${authorized}`
      );
    } else {
      // Fall back to checking Firebase directly
      authorized = await isUserAuthorized(userId);
      console.log(
        `Checked authorization in Firebase for ${userId}: ${authorized}`
      );
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to use this tool. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    const {
      action,
      token,
      channelId,
      channelIds,
      message,
      minDelay,
      maxDelay,
      processId,
    } = await request.json();

    if (action === "start") {
      // Check if user already has an active process in Firebase
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
      if (storedProcess && storedProcess.active) {
        return NextResponse.json(
          {
            error: "You already have an active auto-messager process running",
            hasActiveProcess: true,
            processId: storedProcess.processId,
          },
          { status: 400 }
        );
      }

      // Create a unique process ID
      const newProcessId = Date.now().toString();

      // Handle both single channelId and multiple channelIds for backward compatibility
      const targetChannelIds = channelIds || (channelId ? [channelId] : []);

      if (targetChannelIds.length === 0) {
        return NextResponse.json(
          { error: "At least one channel ID is required" },
          { status: 400 }
        );
      }

      // Store process information
      const processInfo = {
        token,
        channelIds: targetChannelIds,
        message,
        minDelay: parseInt(minDelay),
        maxDelay: parseInt(maxDelay),
        startTime: new Date().toISOString(),
        messagesSent: 0,
        active: true,
        lastError: null,
      };

      // Store by user ID and process ID
      if (!activeProcesses.has(userId)) {
        activeProcesses.set(userId, new Map());
      }
      activeProcesses.get(userId).set(newProcessId, processInfo);

      // Save to Firebase (without sensitive data)
      const processForStorage = {
        ...processInfo,
        processId: newProcessId,
        startTime: processInfo.startTime,
      };
      delete processForStorage.token; // Remove token property entirely
      await saveToolProcessAdmin(
        userId,
        TOOL_TYPE,
        newProcessId,
        processForStorage
      );

      // Start the messaging process
      startMessagingProcess(userId, newProcessId);

      return NextResponse.json({
        success: true,
        message: "Auto-messager started",
        processId: newProcessId,
        status: {
          ...processInfo,
          token: undefined, // Don't send token back to client
        },
      });
    } else if (action === "stop") {
      // Find and stop the process
      if (
        activeProcesses.has(userId) &&
        activeProcesses.get(userId).has(processId)
      ) {
        const process = activeProcesses.get(userId).get(processId);
        process.active = false;

        // Clear any scheduled message sends
        const intervalKey = `${userId}-${processId}`;
        if (messageIntervals.has(intervalKey)) {
          clearTimeout(messageIntervals.get(intervalKey));
          messageIntervals.delete(intervalKey);
        }

        // Update Firebase
        await updateToolProcessStatsAdmin(userId, TOOL_TYPE, {
          active: false,
          messagesSent: process.messagesSent,
        });

        return NextResponse.json({
          success: true,
          message: "Auto-messager stopped",
          status: {
            ...process,
            token: undefined, // Don't send token back to client
          },
        });
      }

      // Check if process exists in Firebase
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
      if (storedProcess && storedProcess.processId === processId) {
        // Update Firebase to mark process as inactive
        await updateToolProcessStatsAdmin(userId, TOOL_TYPE, { active: false });

        return NextResponse.json({
          success: true,
          message: "Process stopped in database",
          status: {
            ...storedProcess,
            active: false,
          },
        });
      }

      return NextResponse.json(
        {
          error: "Process not found",
        },
        { status: 404 }
      );
    } else if (action === "status" && processId) {
      // Check process status
      if (
        activeProcesses.has(userId) &&
        activeProcesses.get(userId).has(processId)
      ) {
        const process = activeProcesses.get(userId).get(processId);

        return NextResponse.json({
          success: true,
          status: {
            ...process,
            token: undefined, // Don't send token back to client
          },
        });
      }

      // Check if process exists in Firebase
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
      if (storedProcess && storedProcess.processId === processId) {
        return NextResponse.json({
          success: true,
          status: {
            ...storedProcess,
            active: false,
          },
        });
      }

      return NextResponse.json(
        {
          error: "Process not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auto-messager error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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
      console.log(`Using standard discord.id: ${userId}`);
    }
    // Then check if there's a regular id property
    else if (session.user.id) {
      userId = session.user.id;
      console.log(`Using session.user.id: ${userId}`);
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
        console.log(`Extracted Discord ID from avatar URL: ${userId}`);
      }
    }

    if (!userId) {
      console.error("No user ID found in session:", session.user);
      return NextResponse.json(
        { error: "Discord ID not found in session", success: false },
        { status: 401 }
      );
    }

    // Check if user is authorized - always authorize if authorized property is in session
    let authorized = false;

    if (session.user.authorized !== undefined) {
      // Use the value from the session if available
      authorized = session.user.authorized;
      console.log(
        `Using authorization from session for ${userId}: ${authorized}`
      );
    } else {
      // Fall back to checking Firebase directly
      authorized = await isUserAuthorized(userId);
      console.log(
        `Checked authorization in Firebase for ${userId}: ${authorized}`
      );
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to use this tool. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (processId) {
      // Return status of specific process
      if (
        activeProcesses.has(userId) &&
        activeProcesses.get(userId).has(processId)
      ) {
        const process = activeProcesses.get(userId).get(processId);

        return NextResponse.json({
          success: true,
          status: {
            ...process,
            token: undefined, // Don't send token back to client
          },
        });
      }

      // Check if process exists in Firebase
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
      if (storedProcess && storedProcess.processId === processId) {
        return NextResponse.json({
          success: true,
          status: {
            ...storedProcess,
            active: false,
          },
        });
      }

      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    // Check for active processes
    const checkActive = searchParams.get("checkActive") === "true";
    if (checkActive) {
      // First check Firebase
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
      if (storedProcess && storedProcess.active) {
        return NextResponse.json({
          success: true,
          hasActiveProcess: true,
          activeProcessId: storedProcess.processId,
        });
      }

      // Then check memory
      if (activeProcesses.has(userId)) {
        const userProcesses = Array.from(activeProcesses.get(userId).entries());
        const activeProcess = userProcesses.find(
          ([, process]) => process.active
        );

        if (activeProcess) {
          return NextResponse.json({
            success: true,
            hasActiveProcess: true,
            activeProcessId: activeProcess[0],
          });
        }
      }

      return NextResponse.json({
        success: true,
        hasActiveProcess: false,
      });
    }

    // Return all processes for user
    const processes = [];

    // Get processes from Firebase
    const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
    if (storedProcess) {
      processes.push({
        processId: storedProcess.processId,
        ...storedProcess,
        token: undefined, // Don't send token back to client
      });
    }

    // Get processes from memory
    if (activeProcesses.has(userId)) {
      const memoryProcesses = Array.from(
        activeProcesses.get(userId).entries()
      ).map(([id, process]) => ({
        processId: id,
        ...process,
        token: undefined, // Don't send token back to client
      }));
      processes.push(...memoryProcesses);
    }

    return NextResponse.json({
      success: true,
      processes,
    });
  } catch (error) {
    console.error("Error in GET auto-messager:", error);
    return NextResponse.json(
      { error: "Server error", success: false },
      { status: 500 }
    );
  }
}
