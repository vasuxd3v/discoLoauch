import { useState, useEffect, useRef, useCallback } from "react";

/**
 * A simplified Discord gateway connector specifically for DM auto-replies
 */
export default function useSimpleDiscordGateway({
  token,
  messageContent,
  cooldown,
  blacklist = [],
  replyToAllDms = true,
  onMessageSent,
  onError,
  enabled,
}) {
  const [connected, setConnected] = useState(false);
  const [repliesSent, setRepliesSent] = useState(0);
  const wsRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastReplyTimestampsRef = useRef({});
  const userIdRef = useRef(null);

  // For debugging
  const logDebug = useCallback((msg) => {
    console.log(`[DM Auto Reply] ${msg}`);
  }, []);

  // Extract user ID from token
  const getUserIdFromToken = useCallback(() => {
    try {
      if (!token) return null;

      // Try to decode the bot token
      const tokenParts = token.split(".");
      if (tokenParts.length < 1) return null;

      // Add padding if needed
      let base64 = tokenParts[0];
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }

      // Decode and return
      return atob(base64);
    } catch (error) {
      logDebug(`Error extracting user ID from token: ${error.message}`);
      return null;
    }
  }, [token, logDebug]);

  // Send a message to Discord
  const sendMessage = useCallback(
    async (channelId) => {
      try {
        const now = Date.now();
        const userId = channelId.split("-").pop();

        // Check if user is blacklisted
        if (blacklist.includes(userId)) {
          logDebug(`User ${userId} is blacklisted, not sending reply`);
          return false;
        }

        // Check cooldown for this specific user
        if (
          lastReplyTimestampsRef.current[userId] &&
          now - lastReplyTimestampsRef.current[userId] < cooldown * 1000
        ) {
          logDebug(
            `Cooldown active for user ${userId}, skipping reply. ${Math.round(
              (cooldown * 1000 -
                (now - lastReplyTimestampsRef.current[userId])) /
                1000
            )}s remaining.`
          );
          return false;
        }

        logDebug(`Sending reply to DM channel ${channelId}`);

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
              content: messageContent,
            }),
          }
        );

        if (response.ok) {
          logDebug(`Successfully sent reply to DM channel ${channelId}`);
          lastReplyTimestampsRef.current[userId] = now;
          setRepliesSent((prev) => prev + 1);
          if (onMessageSent) onMessageSent();
          return true;
        }

        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          logDebug(`Rate limited: ${JSON.stringify(errorData)}`);
          if (onError) onError(`Rate limited. Try again later.`);
          return false;
        }

        logDebug(
          `Failed to send message: ${response.status}, ${JSON.stringify(
            errorData
          )}`
        );
        if (onError)
          onError(
            `Discord API error: ${response.status} ${JSON.stringify(errorData)}`
          );
        return false;
      } catch (error) {
        logDebug(`Error sending DM reply: ${error.message}`);
        if (onError) onError(error.message || "Failed to send reply");
        return false;
      }
    },
    [
      token,
      messageContent,
      cooldown,
      blacklist,
      onMessageSent,
      onError,
      logDebug,
    ]
  );

  // Send heartbeat to keep the connection alive
  const sendHeartbeat = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        op: 1, // Heartbeat opcode
        d: null,
      })
    );
  }, []);

  // Handle incoming messages
  const handleDirectMessage = useCallback(
    (message) => {
      // Check if this is a DM
      const isDM = message.guild_id === null && !message.webhook_id;

      // Skip our own messages
      if (message.author.id === userIdRef.current) {
        return;
      }

      if (isDM) {
        logDebug(
          `Received DM from ${message.author.username} (${message.author.id})`
        );

        // If replyToAllDms is false, check if this is a new DM (no previous messages)
        if (!replyToAllDms) {
          // This is a simplification - in reality we'd need to check message history
          // But for this implementation we'll use the lastReplyTimestampsRef as a proxy
          if (lastReplyTimestampsRef.current[message.author.id]) {
            logDebug(
              `Not replying to existing conversation with ${message.author.id}`
            );
            return;
          }
        }

        // Send reply to this DM
        sendMessage(message.channel_id);
      }
    },
    [sendMessage, replyToAllDms, logDebug]
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.op) {
          case 10: // Hello
            // Start heartbeat
            const heartbeatInterval = data.d.heartbeat_interval;
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(
              sendHeartbeat,
              heartbeatInterval
            );

            // Send identify
            wsRef.current.send(
              JSON.stringify({
                op: 2, // Identify
                d: {
                  token: token,
                  properties: {
                    $os: "windows",
                    $browser: "chrome",
                    $device: "chrome",
                  },
                  // Use DM and Guild intents
                  intents: (1 << 0) | (1 << 9) | (1 << 12) | (1 << 15),
                },
              })
            );
            break;

          case 0: // Dispatch
            // Handle READY event to get user ID
            if (data.t === "READY") {
              logDebug("Connected to Discord Gateway");
              userIdRef.current = data.d.user.id;
              setConnected(true);
            }
            // Handle direct messages
            else if (data.t === "MESSAGE_CREATE") {
              handleDirectMessage(data.d);
            }
            break;
        }
      } catch (error) {
        logDebug(`Error handling WebSocket message: ${error.message}`);
      }
    },
    [token, sendHeartbeat, logDebug, handleDirectMessage]
  );

  // Connect to Discord gateway
  const connect = useCallback(() => {
    if (!enabled || !token) {
      return;
    }

    try {
      // Close existing connection if it exists
      if (wsRef.current) {
        wsRef.current.close(1000, "Reconnecting");
      }

      logDebug("Connecting to Discord Gateway");
      wsRef.current = new WebSocket(
        "wss://gateway.discord.gg/?v=9&encoding=json"
      );

      // Set up event handlers
      wsRef.current.onopen = () => {
        logDebug("WebSocket connection established");
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (error) => {
        logDebug(`WebSocket error: ${error}`);
        if (onError) onError("Connection error with Discord");
      };

      wsRef.current.onclose = (event) => {
        logDebug(
          `WebSocket closed: Code ${event.code} - ${
            event.reason || "No reason"
          }`
        );
        setConnected(false);
        clearInterval(heartbeatIntervalRef.current);

        // Handle authentication errors
        if (event.code === 4004) {
          logDebug("Authentication failed - invalid token");
          if (onError)
            onError("Discord authentication failed. Your token is invalid.");
          return;
        }

        // Attempt to reconnect after a delay if still enabled
        if (enabled) {
          setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    } catch (error) {
      logDebug(`Error creating WebSocket: ${error.message}`);
      if (onError) onError(`Failed to connect: ${error.message}`);
    }
  }, [enabled, token, handleMessage, onError, logDebug]);

  // Disconnect from Discord gateway
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (wsRef.current) {
      logDebug("Closing WebSocket connection");
      wsRef.current.close(1000, "Disconnecting");
      wsRef.current = null;
    }

    setConnected(false);
  }, [logDebug]);

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  return {
    connected,
    repliesSent,
  };
}
