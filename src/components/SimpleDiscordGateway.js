import { useState, useEffect, useRef, useCallback } from "react";

export default function useSimpleDiscordGateway({
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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastReplySentRef = useRef(null);

  // Function to send a reply message to Discord
  const sendReply = useCallback(
    async (channelId) => {
      try {
        if (!channelId) return false;

        const now = Date.now();
        if (
          lastReplySentRef.current &&
          now - lastReplySentRef.current < cooldown * 1000
        ) {
          console.log(
            `Cooldown active, skipping reply. ${Math.round(
              (cooldown * 1000 - (now - lastReplySentRef.current)) / 1000
            )}s remaining.`
          );
          return false;
        }

        console.log(`Sending reply to channel ${channelId}`);

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
            body: JSON.stringify({ content: replyContent }),
          }
        );

        if (response.ok) {
          console.log(`Reply sent successfully to channel ${channelId}`);
          lastReplySentRef.current = now;
          if (onMessageSent) onMessageSent();
          return true;
        }

        const errorData = await response.json().catch(() => ({}));
        console.error("Discord API error:", response.status, errorData);
        if (onError) onError(`Failed to send message: ${response.status}`);
        return false;
      } catch (error) {
        console.error("Error sending reply:", error);
        if (onError) onError(error.message || "Failed to send reply");
        return false;
      }
    },
    [token, replyContent, cooldown, onMessageSent, onError]
  );

  // Get user ID from token (to filter own messages)
  const getUserIdFromToken = useCallback(() => {
    try {
      if (!token) return null;

      const base64 = token.split(".")[0];
      return atob(base64);
    } catch (error) {
      console.error("Error decoding user ID from token:", error);
      return null;
    }
  }, [token]);

  // Handle incoming messages
  const handleMessageCreate = useCallback(
    (message) => {
      // Skip own messages
      const myUserId = getUserIdFromToken();
      if (myUserId && message.author && message.author.id === myUserId) {
        return;
      }

      // Check if message is from a monitored server
      if (
        servers.length > 0 &&
        message.guild_id &&
        !servers.includes(message.guild_id)
      ) {
        return;
      }

      // Check if message contains any trigger words
      if (!message.content) return;

      const content = message.content.toLowerCase();
      const matchedTrigger = triggerWords.find((word) =>
        content.includes(word.toLowerCase())
      );

      if (matchedTrigger) {
        console.log(`Trigger word "${matchedTrigger}" detected in message`);
        sendReply(message.channel_id);
      }
    },
    [servers, triggerWords, sendReply, getUserIdFromToken]
  );

  // Connect to Discord Gateway
  const connect = useCallback(() => {
    if (!enabled || !token) return;

    try {
      // Close existing connection if it exists
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log("Connecting to Discord Gateway...");
      wsRef.current = new WebSocket(
        "wss://gateway.discord.gg/?v=9&encoding=json"
      );

      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened");
        setConnected(true);

        // Send identify payload immediately on open
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
              intents: (1 << 9) | (1 << 0) | (1 << 15), // GUILD_MESSAGES, GUILDS, MESSAGE_CONTENT
            },
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle heartbeat
          if (data.op === 10) {
            // Hello
            const interval = data.d.heartbeat_interval;
            console.log(
              `Received Hello with heartbeat interval: ${interval}ms`
            );

            // Clear any existing heartbeat interval
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
            }

            // Setup heartbeat interval
            heartbeatIntervalRef.current = setInterval(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log("Sending heartbeat");
                wsRef.current.send(
                  JSON.stringify({
                    op: 1, // Heartbeat
                    d: null,
                  })
                );
              }
            }, interval);
          }

          // Handle heartbeat ACK
          if (data.op === 11) {
            console.log("Heartbeat acknowledged");
          }

          // Handle messages
          if (data.op === 0 && data.t === "MESSAGE_CREATE") {
            console.log("Received message");
            handleMessageCreate(data.d);
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (onError) onError("Connection error");
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code}`);
        setConnected(false);

        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Try to reconnect if still enabled
        if (enabled && reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(
            `Reconnecting in ${delay / 1000}s (attempt ${
              reconnectAttempts + 1
            }/5)`
          );

          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      if (onError) onError("Failed to connect");
    }
  }, [enabled, token, handleMessageCreate, onError, reconnectAttempts]);

  // Disconnect from Discord Gateway
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
  }, []);

  // Connect on component mount, disconnect on unmount
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

  return { connected, reconnectAttempts };
}
