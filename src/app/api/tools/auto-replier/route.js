import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Map to store active auto-replier processes by user ID and process ID
const activeProcesses = new Map();

// Simple function to validate a Discord token
async function validateToken(token) {
  try {
    const response = await fetch(`https://discord.com/api/v9/users/@me`, {
      headers: {
        Authorization: token,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      return {
        valid: true,
        username: userData.username,
        id: userData.id,
      };
    }

    return {
      valid: false,
      error: `Invalid token (status: ${response.status})`,
    };
  } catch (error) {
    console.error("Error validating token:", error);
    return { valid: false, error: error.message };
  }
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      action,
      token,
      servers,
      triggerWords,
      replyContent,
      cooldown,
      processId,
      repliesSent,
    } = await request.json();

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
              error: "You already have an active auto-replier process running",
              hasActiveProcess: true,
            },
            { status: 400 }
          );
        }
      }

      // Quick validation
      const validationResult = await validateToken(token);
      if (!validationResult.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error,
          },
          { status: 400 }
        );
      }

      // Create a unique process ID
      const newProcessId = Date.now().toString();

      // Store process information
      const processInfo = {
        token,
        servers: Array.isArray(servers) ? servers : [servers],
        triggerWords: Array.isArray(triggerWords)
          ? triggerWords
          : triggerWords.split(",").map((word) => word.trim()),
        replyContent,
        cooldown: parseInt(cooldown),
        startTime: new Date().toISOString(),
        repliesSent: 0,
        lastReplySent: null,
        active: true,
        lastError: null,
        botUsername: validationResult.username,
        botId: validationResult.id,
      };

      // Store by user ID and process ID
      if (!activeProcesses.has(userId)) {
        activeProcesses.set(userId, new Map());
      }
      activeProcesses.get(userId).set(newProcessId, processInfo);

      return NextResponse.json({
        success: true,
        message: "Auto-replier started",
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

        return NextResponse.json({
          success: true,
          message: "Auto-replier stopped",
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
      // Update replies sent count if provided
      if (
        repliesSent !== undefined &&
        activeProcesses.has(userId) &&
        activeProcesses.get(userId).has(processId)
      ) {
        const process = activeProcesses.get(userId).get(processId);
        process.repliesSent = repliesSent;
        process.lastReplySent = new Date().toISOString();
      }

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
    console.error("Auto-replier error:", error);
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
