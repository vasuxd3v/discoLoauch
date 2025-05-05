import { useState, useEffect, useRef, useCallback } from "react";

export default function useDiscordGatewayConnector({
  token,
  triggerWords,
  servers,
  replyContent,
  cooldown,
  onMessageSent,
  onError,
  enabled,
}) {
  const [connected, setConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [resumeGatewayUrl, setResumeGatewayUrl] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastReplySentRef = useRef(null);
  const connectionTimerRef = useRef(null);

  // For debugging
  const logDebug = useCallback((msg) => {
    console.log(`[Discord Gateway] ${msg}`);
  }, []);

  // Extract user ID from token
  const getUserIdFromToken = useCallback(() => {
    try {
      if (!token) return null;

      // Try to decode the bot token
      try {
        // The user ID is encoded in the first part of the token
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) return null;

        // Add padding if needed
        let base64 = tokenParts[0];
        while (base64.length % 4 !== 0) {
          base64 += "=";
        }

        // Decode and return
        return atob(base64);
      } catch (error) {
        logDebug(`Error extracting user ID from token: ${error.message}`);

        // If we can't decode the token, make an API call to Discord to get the bot ID
        return null;
      }
    } catch (error) {
      logDebug(`Error in getUserIdFromToken: ${error.message}`);
      return null;
    }
  }, [token, logDebug]);

  // Send heartbeat to keep the connection alive
  const sendHeartbeat = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logDebug("Cannot send heartbeat - WebSocket not connected");
      return;
    }

    logDebug(`Sending heartbeat, sequence: ${sequence}`);
    wsRef.current.send(
      JSON.stringify({
        op: 1, // Heartbeat opcode
        d: sequence,
      })
    );

    // Set a timeout to detect missed heartbeat ACKs
    clearTimeout(connectionTimerRef.current);
    connectionTimerRef.current = setTimeout(() => {
      logDebug("Heartbeat ACK not received within timeout, reconnecting...");
      if (wsRef.current) {
        wsRef.current.close(4000, "Heartbeat ACK timeout");
      }
    }, 15000); // 15 second timeout for heartbeat ACK
  }, [sequence, logDebug]);

  // Send identify payload to Discord
  const sendIdentify = useCallback(() => {
    if (
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !token
    ) {
      logDebug(
        `Cannot identify: ${
          !wsRef.current
            ? "No WebSocket"
            : wsRef.current.readyState !== WebSocket.OPEN
            ? "WebSocket not open"
            : "No token"
        }`
      );
      return;
    }

    logDebug(`Sending identify payload`);
    wsRef.current.send(
      JSON.stringify({
        op: 2, // Identify opcode
        d: {
          // Use the token directly without any modifications to match auto-messager
          token: token,
          properties: {
            $os: "windows",
            $browser: "chrome",
            $device: "chrome",
          },
          // Use more intents to ensure we receive all needed events
          // 1 << 0 (guilds) | 1 << 9 (guild messages) | 1 << 15 (message content)
          intents: (1 << 0) | (1 << 9) | (1 << 15),
        },
      })
    );
  }, [token, logDebug]);

  // Send resume payload if we get disconnected
  const sendResume = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logDebug("Cannot resume - WebSocket not connected");
      return;
    }

    if (!sessionId || !sequence) {
      logDebug(`Cannot resume: missing sessionId or sequence`);
      return;
    }

    logDebug(
      `Sending resume payload, sessionId: ${sessionId}, sequence: ${sequence}`
    );
    wsRef.current.send(
      JSON.stringify({
        op: 6, // Resume opcode
        d: {
          token: token,
          session_id: sessionId,
          seq: sequence,
        },
      })
    );
  }, [token, sessionId, sequence, logDebug]);

  // Function to send a reply message to Discord
  const sendReply = useCallback(
    async (channelId) => {
      try {
        if (!channelId) {
          logDebug(`Invalid channel ID: ${channelId}`);
          if (onError) onError(`Cannot send message: Invalid channel ID`);
          return false;
        }

        const now = Date.now();

        // Check cooldown
        if (
          lastReplySentRef.current &&
          now - lastReplySentRef.current < cooldown * 1000
        ) {
          logDebug(
            `Cooldown active, skipping reply. ${Math.round(
              (cooldown * 1000 - (now - lastReplySentRef.current)) / 1000
            )}s remaining.`
          );
          return false;
        }

        logDebug(`Attempting to send reply to channel ${channelId}`);

        const response = await fetch(
          `https://discord.com/api/v9/channels/${channelId}/messages`,
          {
            method: "POST",
            headers: {
              // Use token directly without 'Bot ' prefix to match auto-messager
              Authorization: token,
              "Content-Type": "application/json",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
            },
            body: JSON.stringify({
              content: replyContent,
            }),
          }
        );

        if (response.ok) {
          logDebug(`Successfully sent reply to channel ${channelId}`);
          lastReplySentRef.current = now;
          if (onMessageSent) onMessageSent();
          return true;
        }

        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          logDebug(`Rate limited: ${JSON.stringify(errorData)}`);
          if (onError) onError(`Rate limited. Try again later.`);
          return false;
        }

        if (response.status === 404) {
          logDebug(`Channel not found: ${channelId}`);
          if (onError)
            onError(`Channel not accessible or doesn't exist: ${channelId}`);
          return false;
        }

        if (response.status === 401 || response.status === 403) {
          logDebug(`Authentication error: ${response.status}`);
          if (onError)
            onError(`Discord authentication error. Please check your token.`);
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
        logDebug(`Error sending reply: ${error.message}`);
        if (onError) onError(error.message || "Failed to send reply");
        return false;
      }
    },
    [token, replyContent, cooldown, onMessageSent, onError, logDebug]
  );

  // Handle new messages
  const handleMessageCreate = useCallback(
    (message) => {
      // Get token user ID
      const tokenUserId = getUserIdFromToken();

      // Skip our own messages
      if (tokenUserId && message.author && message.author.id === tokenUserId) {
        logDebug(`Skipping own message`);
        return;
      }

      // Check if message is from a server we're monitoring
      if (
        servers.length > 0 &&
        message.guild_id &&
        !servers.includes(message.guild_id)
      ) {
        logDebug(
          `Message not from monitored server. Message guild: ${message.guild_id}`
        );
        return;
      }

      if (!message.content) {
        logDebug(`Message has no content, skipping`);
        return;
      }

      logDebug(
        `Processing message: "${message.content.substring(0, 30)}${
          message.content.length > 30 ? "..." : ""
        }" in channel ${message.channel_id}`
      );

      // Check if message contains any trigger words
      const content = message.content.toLowerCase();
      const matchedTrigger = triggerWords.find((word) =>
        content.includes(word.toLowerCase())
      );

      if (matchedTrigger) {
        logDebug(`Trigger word "${matchedTrigger}" detected in message`);
        sendReply(message.channel_id);
      }
    },
    [servers, triggerWords, sendReply, getUserIdFromToken, logDebug]
  );

  // Handle dispatch events from Discord
  const handleDispatch = useCallback(
    (data) => {
      switch (data.t) {
        case "READY":
          // Got session data
          logDebug(`READY event received: Session ID: ${data.d.session_id}`);
          setSessionId(data.d.session_id);
          setResumeGatewayUrl(data.d.resume_gateway_url);
          setConnected(true); // Mark as officially connected when READY is received
          setReconnectAttempts(0); // Reset reconnect attempts on successful connection
          break;

        case "MESSAGE_CREATE":
          logDebug(`MESSAGE_CREATE event received`);
          handleMessageCreate(data.d);
          break;

        case "RESUMED":
          logDebug(`Successfully resumed previous session`);
          setConnected(true);
          setReconnectAttempts(0); // Reset reconnect attempts on successful resume
          break;
      }
    },
    [handleMessageCreate, logDebug]
  );

  // Handle incoming messages from Discord Gateway
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);
        logDebug(`Received op: ${data.op}`);

        // Update sequence number
        if (data.s !== null) {
          setSequence(data.s);
        }

        switch (data.op) {
          case 10: // Hello
            // Start sending heartbeats
            logDebug(
              `Received Hello, heartbeat interval: ${data.d.heartbeat_interval}ms`
            );
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = setInterval(
              () => sendHeartbeat(),
              data.d.heartbeat_interval
            );

            // Send identify after hello (using setTimeout to ensure it's not in same execution cycle)
            setTimeout(() => sendIdentify(), 500);
            break;

          case 11: // Heartbeat ACK
            logDebug(`Heartbeat acknowledged`);
            setLastHeartbeat(new Date().toISOString());
            // Clear the timeout since we got an ACK
            clearTimeout(connectionTimerRef.current);
            break;

          case 0: // Dispatch
            handleDispatch(data);
            break;

          case 9: // Invalid Session
            logDebug(`Invalid session. Reconnectable: ${data.d}`);
            // Clear cached session data
            setSessionId(null);
            setSequence(null);
            setResumeGatewayUrl(null);

            // If session is not reconnectable, notify user
            if (!data.d) {
              if (onError)
                onError("Discord session invalid. Please check your token.");
            }

            // Wait a bit then identify again
            setTimeout(() => {
              if (
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
              ) {
                sendIdentify();
              }
            }, 5000);
            break;

          case 7: // Reconnect
            // Discord wants us to reconnect
            logDebug(`Discord requested reconnect`);
            if (wsRef.current) {
              wsRef.current.close(1000, "Discord requested reconnect");
            }
            break;
        }
      } catch (error) {
        logDebug(`Error handling WebSocket message: ${error.message}`);
        if (onError) onError(`WebSocket message error: ${error.message}`);
      }
    },
    [handleDispatch, sendIdentify, sendHeartbeat, onError, logDebug]
  );

  // Connect to Discord Gateway
  const connect = useCallback(() => {
    if (!enabled || !token) {
      logDebug(`Connection not enabled or token missing`);
      return;
    }

    try {
      // Clear any existing connection timers
      clearTimeout(connectionTimerRef.current);

      const url =
        resumeGatewayUrl && sessionId
          ? `${resumeGatewayUrl}/?v=9&encoding=json`
          : "wss://gateway.discord.gg/?v=9&encoding=json";

      logDebug(
        `Connecting to Discord Gateway: ${
          resumeGatewayUrl ? "resume URL" : "default URL"
        }`
      );

      // Close existing connection if it exists
      if (wsRef.current) {
        wsRef.current.close(1000, "Reconnecting");
      }

      // Set a connection timeout
      connectionTimerRef.current = setTimeout(() => {
        if (!connected) {
          logDebug("Connection timeout after 15 seconds");
          if (wsRef.current) {
            wsRef.current.close(4000, "Connection timeout");
          }

          if (onError)
            onError(
              "Connection to Discord timed out. Please check your token and network connection."
            );
        }
      }, 15000); // 15 second connection timeout

      wsRef.current = new WebSocket(url);

      // Connection opened
      wsRef.current.onopen = () => {
        logDebug(`WebSocket connection established`);
        // Note: We don't set connected=true here, wait for READY event
      };

      // Handle incoming messages
      wsRef.current.onmessage = handleMessage;

      // Handle errors
      wsRef.current.onerror = (error) => {
        logDebug(`WebSocket error: ${error}`);
        clearTimeout(connectionTimerRef.current);
        if (onError)
          onError(
            "Connection error with Discord. Please check your token and network."
          );
      };

      // Handle disconnection
      wsRef.current.onclose = (event) => {
        setConnected(false);
        logDebug(
          `WebSocket closed: Code ${event.code} - ${
            event.reason || "No reason provided"
          }`
        );
        clearInterval(heartbeatIntervalRef.current);
        clearTimeout(connectionTimerRef.current);

        // Check for specific close codes
        if (event.code === 4004) {
          logDebug("Authentication failed - invalid token");
          if (onError)
            onError("Discord authentication failed. Your token is invalid.");
          return; // Don't attempt to reconnect with invalid credentials
        }

        if (event.code === 4013 || event.code === 4014) {
          logDebug("Invalid intents specified");
          if (onError)
            onError(
              "Discord connection failed. Invalid intents specified for this bot token."
            );
          return; // Don't attempt to reconnect with invalid intents
        }

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          logDebug(
            `Reconnecting in ${delay / 1000} seconds (attempt ${
              reconnectAttempts + 1
            }/5)...`
          );

          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        } else if (enabled && reconnectAttempts >= 5) {
          logDebug(`Maximum reconnection attempts reached`);
          if (onError)
            onError(
              "Failed to maintain connection to Discord. Maximum reconnection attempts reached."
            );
        }
      };
    } catch (error) {
      logDebug(`Error creating WebSocket: ${error.message}`);
      clearTimeout(connectionTimerRef.current);
      if (onError) onError(`Failed to connect: ${error.message}`);
    }
  }, [
    enabled,
    token,
    sessionId,
    resumeGatewayUrl,
    reconnectAttempts,
    connected,
    handleMessage,
    onError,
    logDebug,
  ]);

  // Close connection when component unmounts
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    clearTimeout(connectionTimerRef.current);

    if (wsRef.current) {
      logDebug(`Closing WebSocket connection`);
      wsRef.current.close(1000, "Unmounting component");
    }
  }, [logDebug]);

  // Validate the token with Discord API
  const validateToken = useCallback(async () => {
    if (!token || !enabled) return;

    try {
      const response = await fetch("https://discord.com/api/v9/users/@me", {
        headers: {
          // Use the token directly without 'Bot ' prefix to match auto-messager implementation
          Authorization: token,
        },
      });

      if (!response.ok) {
        const statusText = response.statusText;
        logDebug(`Token validation failed: ${response.status} ${statusText}`);

        if (response.status === 401) {
          if (onError)
            onError("Invalid Discord token. Please check your credentials.");
        } else {
          if (onError)
            onError(`Discord API error: ${response.status} ${statusText}`);
        }
        return false;
      }

      logDebug("Token validation successful");
      return true;
    } catch (error) {
      logDebug(`Token validation error: ${error.message}`);
      if (onError) onError(`Failed to validate token: ${error.message}`);
      return false;
    }
  }, [token, enabled, logDebug, onError]);

  // Connect when component mounts and disconnect when unmounting
  useEffect(() => {
    let isValid = false;

    if (enabled && token) {
      // First validate the token
      validateToken().then((valid) => {
        isValid = valid;
        if (isValid) {
          connect();
        }
      });
    } else {
      disconnect();
      setConnected(false);
    }

    return () => {
      disconnect();
    };
  }, [token, enabled, connect, disconnect, validateToken]);

  return {
    connected,
    lastHeartbeat,
    reconnectAttempts,
  };
}
