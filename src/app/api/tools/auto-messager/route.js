import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Map to store active messaging processes by user ID and process ID
const activeProcesses = new Map();
// Map to store interval IDs for message sending
const messageIntervals = new Map();

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

  // Function to send a message and schedule the next one
  const sendAndScheduleNext = async () => {
    if (!process.active) {
      // Stop if the process is no longer active
      clearTimeout(messageIntervals.get(`${userId}-${processId}`));
      messageIntervals.delete(`${userId}-${processId}`);
      return;
    }

    const result = await sendMessageToDiscord(
      process.token,
      process.channelId,
      process.message
    );

    if (result.success) {
      process.messagesSent++;

      // Calculate random delay for next message
      const delayMs =
        Math.floor(
          Math.random() * (process.maxDelay - process.minDelay + 1) +
            process.minDelay
        ) * 1000; // Convert to milliseconds

      // Schedule next message
      const timeoutId = setTimeout(sendAndScheduleNext, delayMs);
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    } else if (result.rateLimited) {
      // If rate limited, try again after the specified delay
      const timeoutId = setTimeout(sendAndScheduleNext, result.retryAfter);
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    } else {
      // If there was an error, try again after a default delay
      process.lastError = result.error;
      const timeoutId = setTimeout(sendAndScheduleNext, 10000); // 10 seconds retry
      messageIntervals.set(`${userId}-${processId}`, timeoutId);
    }
  };

  // Start the messaging process
  sendAndScheduleNext();
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, token, channelId, message, minDelay, maxDelay, processId } =
      await request.json();
    const userId = session.user.discord?.id || session.user.id || "unknown";

    if (action === "start") {
      // Check if user already has an active process
      if (activeProcesses.has(userId)) {
        const userProcesses = activeProcesses.get(userId);
        const hasActiveProcess = Array.from(userProcesses.values()).some(
          (process) => process.active
        );

        if (hasActiveProcess) {
          return NextResponse.json(
            {
              error: "You already have an active auto-messager process running",
              hasActiveProcess: true,
            },
            { status: 400 }
          );
        }
      }

      // Create a unique process ID
      const newProcessId = Date.now().toString();

      // Store process information
      const processInfo = {
        token,
        channelId,
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
    } else if (action === "stop" && processId) {
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

        return NextResponse.json({
          success: true,
          message: "Auto-messager stopped",
          status: {
            ...process,
            token: undefined, // Don't send token back to client
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
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.discord?.id || session.user.id || "unknown";
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

    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  // Check for active processes
  const checkActive = searchParams.get("checkActive") === "true";
  if (checkActive) {
    if (activeProcesses.has(userId)) {
      const userProcesses = Array.from(activeProcesses.get(userId).entries());
      const activeProcess = userProcesses.find(([, process]) => process.active);

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
  if (activeProcesses.has(userId)) {
    const processes = Array.from(activeProcesses.get(userId).entries()).map(
      ([id, process]) => ({
        processId: id,
        ...process,
        token: undefined, // Don't send token back to client
      })
    );

    return NextResponse.json({
      success: true,
      processes,
    });
  }

  return NextResponse.json({
    success: true,
    processes: [],
  });
}
