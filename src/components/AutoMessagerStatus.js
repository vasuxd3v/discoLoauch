import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoMessagerStatus({ processId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stopping, setStopping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let intervalId;

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/tools/auto-messager?processId=${processId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const data = await response.json();

        if (data.success && data.status) {
          setStatus(data.status);

          // If process is no longer active, stop polling
          if (!data.status.active) {
            clearInterval(intervalId);
          }
        } else {
          setError("Process not found");
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
        setError(err.message || "Failed to fetch status");
        clearInterval(intervalId);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Update status every 3 seconds
    intervalId = setInterval(fetchStatus, 3000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [processId]);

  const handleStop = async () => {
    setStopping(true);

    try {
      const response = await fetch("/api/tools/auto-messager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop",
          processId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop auto-messager");
      }

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        setError("Failed to stop: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error stopping auto-messager:", err);
      setError("Failed to stop: " + (err.message || "Unknown error"));
    } finally {
      setStopping(false);
    }
  };

  const handleBackToForm = () => {
    router.push("/tools/auto-messager");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-300">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <div className="bg-red-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-400">{error}</h2>
          <p className="mt-2 text-gray-400">
            There was a problem accessing the auto-messager status.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleBackToForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Auto Messager
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <p className="text-gray-300">Process not found</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleBackToForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Auto Messager
          </button>
        </div>
      </div>
    );
  }

  // Format channel ID for display (truncate if needed)
  const displayChannelId =
    status.channelId.length > 15
      ? `${status.channelId.substring(0, 7)}...${status.channelId.substring(
          status.channelId.length - 7
        )}`
      : status.channelId;

  // Calculate elapsed time
  const startTime = new Date(status.startTime);
  const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const elapsedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <div
          className={`rounded-full p-3 w-16 h-16 mx-auto mb-4 ${
            status.active ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold">
          {status.active ? "Auto Messager Running" : "Auto Messager Stopped"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Channel ID</div>
          <div className="font-mono text-blue-400">{displayChannelId}</div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Running Time</div>
          <div className="font-mono">{elapsedTime}</div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Messages Sent</div>
          <div className="font-mono">{status.messagesSent}</div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Delay Range</div>
          <div className="font-mono">
            {status.minDelay}s - {status.maxDelay}s
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        {status.active ? (
          <button
            onClick={handleStop}
            disabled={stopping}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {stopping ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Stopping...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Stop Auto Messager
              </>
            )}
          </button>
        ) : (
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-gray-300">Tool has been stopped.</p>
          </div>
        )}

        <button
          onClick={handleBackToForm}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Auto Messager
        </button>
      </div>
    </div>
  );
}
