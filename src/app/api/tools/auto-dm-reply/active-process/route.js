import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// We'll reuse the same activeProcesses map from the main route
// In a production app, you'd use a database or Redis
import { activeProcesses } from "../active-processes";

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user?.id || "anonymous";

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
