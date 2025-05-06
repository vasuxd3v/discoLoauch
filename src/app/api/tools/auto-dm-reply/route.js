import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Import WebSocket for server-side Discord Gateway connection
import WebSocket from "ws";

// Import shared activeProcesses map
import { activeProcesses } from "./active-processes";

// Import Firebase admin functions
import {
  saveToolProcessAdmin,
  getUserToolProcessAdmin,
  updateToolProcessStatsAdmin,
  removeToolProcessAdmin,
} from "@/lib/firebase/firebase-admin";

// Tracks WebSocket connections to Discord Gateway
const gatewayConnections = new Map();

// Define tool type constant
const TOOL_TYPE = "auto-dm-reply";

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;

    // Get processId from query params
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    // If no specific processId requested, check if user has an active process in Firebase
    if (!processId) {
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);

      if (storedProcess && storedProcess.active) {
        // Check if process exists in memory
        const inMemoryProcess = activeProcesses.get(storedProcess.processId);

        if (!inMemoryProcess) {
          // Process exists in Firebase but not in memory - recreate it
          // This handles server restarts or accessing from different devices
          const processData = {
            userId,
            active: true,
            startTime: storedProcess.startTime,
            discordToken: storedProcess.discordToken,
            messageContent: storedProcess.messageContent,
            cooldown: storedProcess.cooldown,
            blacklist: storedProcess.blacklist || [],
            replyToAllDms: storedProcess.replyToAllDms !== false,
            repliesSent: storedProcess.repliesSent || 0,
          };

          // Store in memory
          activeProcesses.set(storedProcess.processId, processData);

          // Restart the Discord connection
          startDiscordGatewayConnection(storedProcess.processId, processData);

          return NextResponse.json({
            success: true,
            message: "Process restored from database",
            processId: storedProcess.processId,
            status: {
              active: true,
              startTime: storedProcess.startTime,
              repliesSent: storedProcess.repliesSent || 0,
              cooldown: storedProcess.cooldown,
            },
          });
        }

        // Return that user already has an active process
        return NextResponse.json({
          success: true,
          message: "Active process found",
          processId: storedProcess.processId,
          status: {
            active: true,
            startTime: storedProcess.startTime,
            repliesSent: storedProcess.repliesSent || 0,
            cooldown: storedProcess.cooldown,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "No active process found",
        hasActiveProcess: false,
      });
    }

    // Get process information for specific processId
    const process = activeProcesses.get(processId);

    if (!process) {
      // Check if process exists in Firebase but not in memory
      const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);

      if (storedProcess && storedProcess.processId === processId) {
        // Process found in Firebase
        return NextResponse.json({
          success: true,
          status: {
            active: storedProcess.active,
            startTime: storedProcess.startTime,
            repliesSent: storedProcess.repliesSent || 0,
            cooldown: storedProcess.cooldown,
          },
        });
      }

      return NextResponse.json(
        { error: "Process not found", success: false },
        { status: 404 }
      );
    }

    // Return process status
    return NextResponse.json({
      success: true,
      status: {
        active: process.active,
        startTime: process.startTime,
        repliesSent: process.repliesSent,
        cooldown: process.cooldown,
      },
    });
  } catch (error) {
    console.error("Error getting Auto DM Reply status:", error);
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

    const userId = session.user?.id || "anonymous";
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
        return handleStop(body, userId);
      default:
        return NextResponse.json(
          { error: "Invalid action", success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in Auto DM Reply API:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

// Handle starting a new Auto DM Reply process
async function handleStart(data, session) {
  const { discordToken, messageContent, cooldown, blacklist, replyToAllDms } =
    data;
  const userId = session.user?.id || "anonymous";

  // Validate required fields
  if (!discordToken || !messageContent || !cooldown) {
    return NextResponse.json(
      {
        error: "Discord token, message content, and cooldown are required",
        success: false,
      },
      { status: 400 }
    );
  }

  try {
    // Check Firebase first for existing active process
    const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);

    if (storedProcess && storedProcess.active) {
      return NextResponse.json(
        {
          error: "You already have an active Auto DM Reply process",
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
            error: "You already have an active Auto DM Reply process",
            success: false,
            processId: Array.from(activeProcesses.entries()).find(
              ([_, proc]) => proc.userId === userId && proc.active
            )?.[0],
          },
          { status: 400 }
        );
      }
    }

    // Create a new process ID
    const processId = `auto-dm-reply-${Date.now()}`;

    // Store process information
    const process = {
      userId,
      active: true,
      startTime: new Date().toISOString(),
      discordToken,
      messageContent,
      cooldown: parseInt(cooldown),
      blacklist: blacklist || [],
      replyToAllDms: replyToAllDms !== false,
      repliesSent: 0,
    };

    // Start Discord Gateway connection for handling DMs
    startDiscordGatewayConnection(processId, process);

    // Store in memory
    activeProcesses.set(processId, process);

    // Store in Firebase (removing sensitive data like token)
    const processForStorage = {
      active: true,
      startTime: process.startTime,
      messageContent,
      cooldown: parseInt(cooldown),
      blacklist: blacklist || [],
      replyToAllDms: replyToAllDms !== false,
      repliesSent: 0,
      discordToken, // We need to store this to restore connections
    };

    await saveToolProcessAdmin(userId, TOOL_TYPE, processId, processForStorage);

    // Send success response
    return NextResponse.json({
      success: true,
      processId,
    });
  } catch (error) {
    console.error("Error starting Auto DM Reply:", error);
    return NextResponse.json(
      { error: "Failed to start Auto DM Reply", success: false },
      { status: 500 }
    );
  }
}

// Handle stopping an existing Auto DM Reply process
async function handleStop(data, userId) {
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
    const storedProcess = await getUserToolProcessAdmin(userId, TOOL_TYPE);
    if (storedProcess && storedProcess.processId === processId) {
      // Update Firebase to mark process as inactive
      await updateToolProcessStatsAdmin(userId, TOOL_TYPE, { active: false });

      return NextResponse.json({
        success: true,
        message: "Process stopped in database",
        status: {
          active: false,
          startTime: storedProcess.startTime,
          repliesSent: storedProcess.repliesSent || 0,
          cooldown: storedProcess.cooldown,
        },
      });
    }

    return NextResponse.json(
      { error: "Process not found", success: false },
      { status: 404 }
    );
  }

  try {
    // Update process status
    process.active = false;

    // Stop the Discord Gateway connection
    stopDiscordGatewayConnection(processId);

    // Update stored process
    activeProcesses.set(processId, process);

    // Update Firebase
    await updateToolProcessStatsAdmin(userId, TOOL_TYPE, {
      active: false,
      repliesSent: process.repliesSent,
    });

    // Send success response
    return NextResponse.json({
      success: true,
      status: {
        active: process.active,
        startTime: process.startTime,
        repliesSent: process.repliesSent,
        cooldown: process.cooldown,
      },
    });
  } catch (error) {
    console.error("Error stopping Auto DM Reply:", error);
    return NextResponse.json(
      { error: "Failed to stop Auto DM Reply", success: false },
      { status: 500 }
    );
  }
}

/**
 * Start a Discord Gateway connection for auto DM replies
 */
function startDiscordGatewayConnection(processId, process) {
  // Stop any existing connection for this process
  if (gatewayConnections.has(processId)) {
    stopDiscordGatewayConnection(processId);
  }

  // Extract required data from process
  const { discordToken, messageContent, cooldown, blacklist, replyToAllDms } =
    process;

  // Store objects related to this connection
  const connectionData = {
    ws: null,
    heartbeatInterval: null,
    reconnectTimeout: null,
    userId: null,
    lastReplySentTimestamps: {},
    sequence: null,
  };

  // Function to connect to Discord Gateway
  const connect = () => {
    try {
      // Create WebSocket connection
      const ws = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");
      connectionData.ws = ws;

      // WebSocket event handlers
      ws.on("open", () => {
        console.log(`[Process ${processId}] Connected to Discord Gateway`);

        // Send identify payload with proper intents for DMs
        ws.send(
          JSON.stringify({
            op: 2, // Identify
            d: {
              token: discordToken,
              properties: {
                $os: "windows",
                $browser: "chrome",
                $device: "chrome",
              },
              // Explicitly include DIRECT_MESSAGES intent (1 << 12)
              intents: 4609, // GUILDS (1 << 0) | GUILD_MESSAGES (1 << 9) | DIRECT_MESSAGES (1 << 12) | MESSAGE_CONTENT (1 << 15)
            },
          })
        );
      });

      // Handle incoming messages from Discord
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Store sequence number for heartbeats
          if (data.s !== null) {
            connectionData.sequence = data.s;
          }

          // Handle Hello event (start heartbeat)
          if (data.op === 10) {
            const heartbeatInterval = data.d.heartbeat_interval;
            clearInterval(connectionData.heartbeatInterval);

            // Setup heartbeat interval
            connectionData.heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    op: 1, // Heartbeat opcode
                    d: connectionData.sequence,
                  })
                );
                console.log(`[Process ${processId}] Heartbeat sent`);
              }
            }, heartbeatInterval);
          }

          // Handle heartbeat ACK
          if (data.op === 11) {
            console.log(`[Process ${processId}] Heartbeat acknowledged`);
          }

          // Handle dispatch events
          if (data.op === 0) {
            console.log(`[Process ${processId}] Received event: ${data.t}`);

            // Save user ID on READY event
            if (data.t === "READY") {
              connectionData.userId = data.d.user.id;
              console.log(
                `[Process ${processId}] Authenticated as ${data.d.user.username}`
              );
              console.log(
                `[Process ${processId}] User ID: ${connectionData.userId}`
              );
            }

            // Handle incoming messages (both guild and DMs)
            if (data.t === "MESSAGE_CREATE") {
              console.log(
                `[Process ${processId}] Raw message: ${JSON.stringify(
                  data.d
                ).substring(0, 100)}...`
              );
              await handleDirectMessage(data.d);
            }
          }
        } catch (err) {
          console.error(
            `[Process ${processId}] Error handling gateway message:`,
            err
          );
        }
      });

      // Handle WebSocket errors and closures
      ws.on("error", (err) => {
        console.error(`[Process ${processId}] WebSocket error:`, err);
      });

      ws.on("close", (code, reason) => {
        console.log(
          `[Process ${processId}] WebSocket closed: ${code} - ${reason}`
        );
        clearInterval(connectionData.heartbeatInterval);

        // Try to reconnect if process is still active
        const process = activeProcesses.get(processId);
        if (process && process.active) {
          clearTimeout(connectionData.reconnectTimeout);
          connectionData.reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000); // Reconnect after 5 seconds
        }
      });
    } catch (err) {
      console.error(
        `[Process ${processId}] Error connecting to Discord Gateway:`,
        err
      );
    }
  };

  // Function to handle incoming direct messages
  const handleDirectMessage = async (message) => {
    try {
      const process = activeProcesses.get(processId);
      if (!process || !process.active) {
        return;
      }

      // More detailed logging to understand message structure
      console.log(
        `[Process ${processId}] Message from: ${
          message.author?.username || "unknown"
        }`
      );
      console.log(
        `[Process ${processId}] Channel type: ${message.channel_type || "N/A"}`
      );
      console.log(
        `[Process ${processId}] Guild ID: ${message.guild_id || "DM"}`
      );

      // FIXED: Check if this is a DM - Discord uses channel_type=1 for DMs
      // We also check with guild_id === null as a fallback
      const isDM =
        message.channel_type === 1 ||
        (message.guild_id === null && !message.webhook_id);

      // Skip our own messages
      if (message.author.id === connectionData.userId) {
        console.log(`[Process ${processId}] Skipping own message`);
        return;
      }

      if (isDM) {
        console.log(
          `[Process ${processId}] Confirmed DM from ${message.author.username} (${message.author.id})`
        );

        // Check blacklist
        if (process.blacklist.includes(message.author.id)) {
          console.log(
            `[Process ${processId}] User ${message.author.id} is blacklisted, skipping`
          );
          return;
        }

        // Check if we should reply to all DMs or only new conversations
        if (
          !process.replyToAllDms &&
          connectionData.lastReplySentTimestamps[message.author.id]
        ) {
          console.log(
            `[Process ${processId}] Not replying to existing conversation with ${message.author.id}`
          );
          return;
        }

        // Check cooldown
        const now = Date.now();
        const lastReplySent =
          connectionData.lastReplySentTimestamps[message.author.id] || 0;
        if (now - lastReplySent < process.cooldown * 1000) {
          console.log(
            `[Process ${processId}] Cooldown active for ${message.author.id}, skipping`
          );
          return;
        }

        // Send reply message
        try {
          console.log(
            `[Process ${processId}] Sending reply to channel ${message.channel_id}`
          );

          const response = await fetch(
            `https://discord.com/api/v9/channels/${message.channel_id}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: process.discordToken,
                "Content-Type": "application/json",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
              },
              body: JSON.stringify({
                content: process.messageContent,
              }),
            }
          );

          const responseData = await response.text();
          console.log(
            `[Process ${processId}] API response: ${response.status}, ${responseData}`
          );

          if (response.ok) {
            console.log(
              `[Process ${processId}] Reply successfully sent to ${message.author.username}`
            );
            connectionData.lastReplySentTimestamps[message.author.id] = now;

            // Update reply count
            process.repliesSent += 1;
            activeProcesses.set(processId, process);

            // Update Firebase with new reply count
            await updateToolProcessStatsAdmin(process.userId, TOOL_TYPE, {
              repliesSent: process.repliesSent,
            });
          } else {
            console.error(
              `[Process ${processId}] Failed to send reply: ${response.status}`
            );
            console.error(
              `[Process ${processId}] Response body: ${responseData}`
            );
          }
        } catch (err) {
          console.error(`[Process ${processId}] Error sending reply:`, err);
        }
      } else {
        console.log(`[Process ${processId}] Message not a DM, ignoring`);
      }
    } catch (err) {
      console.error(`[Process ${processId}] Error handling message:`, err);
    }
  };

  // Start the connection
  connect();

  // Store connection data
  gatewayConnections.set(processId, connectionData);
}

/**
 * Stop a Discord Gateway connection
 */
function stopDiscordGatewayConnection(processId) {
  const connection = gatewayConnections.get(processId);
  if (!connection) return;

  try {
    // Clear intervals and timeouts
    clearInterval(connection.heartbeatInterval);
    clearTimeout(connection.reconnectTimeout);

    // Close WebSocket connection if it exists
    if (connection.ws) {
      if (
        connection.ws.readyState === WebSocket.OPEN ||
        connection.ws.readyState === WebSocket.CONNECTING
      ) {
        connection.ws.close(1000, "Process stopped");
      }
      connection.ws = null;
    }

    // Remove from active connections
    gatewayConnections.delete(processId);
    console.log(`[Process ${processId}] Discord Gateway connection stopped`);
  } catch (err) {
    console.error(
      `[Process ${processId}] Error stopping Discord Gateway connection:`,
      err
    );
  }
}
