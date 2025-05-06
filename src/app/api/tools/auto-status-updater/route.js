import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  createStatusRotater,
  getStatusRotater,
  stopStatusRotater,
} from "@/lib/services/discordStatusService";

// In-memory storage for active processes
// A more robust implementation would use a database
const activeProcesses = new Map();

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Error getting Auto Status Updater status:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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
        return handleStart(body, session);
      case "stop":
        return handleStop(body);
      default:
        return NextResponse.json(
          { error: "Invalid action", success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in Auto Status Updater API:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
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
    // Check if user already has an active process
    const userId = session.user?.id || "anonymous";

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

    // Send success response
    return NextResponse.json({
      success: true,
      processId,
    });
  } catch (error) {
    console.error("Error starting Auto Status Updater:", error);
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
    console.error("Error stopping Auto Status Updater:", error);
    return NextResponse.json(
      { error: "Failed to stop Auto Status Updater", success: false },
      { status: 500 }
    );
  }
}
