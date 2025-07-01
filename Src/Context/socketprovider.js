import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export const useSocket = () => {
  const { socket, isConnected, connectionError } = useContext(SocketContext);
  if (!socket) {
    console.warn(
      "useSocket: Socket is null. Ensure SocketProvider wraps your app and the import path '../../Context/socketprovider' is correct."
    );
  }
  return { socket, isConnected, connectionError };
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    console.log("SocketProvider: Initializing socket...");
    let socketClient = null;

    const initializeSocket = async () => {
      try {
        const apiBaseUrl = await AsyncStorage.getItem("apiBaseUrl");
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        if (apiBaseUrl && phoneNumber) {
          console.log("SocketProvider: Connecting to", apiBaseUrl, "with phoneNumber", phoneNumber);
          
          // Configure socket with reconnection options
          socketClient = io(apiBaseUrl, {
            query: { phoneNumber },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
          });

          // Connection event handlers
          socketClient.on("connect", () => {
            console.log("[SOCKET] Connected with ID:", socketClient.id);
            setIsConnected(true);
            setConnectionError(null);
            setReconnectAttempts(0);
          });

          socketClient.on("disconnect", (reason) => {
            console.log("[SOCKET] Disconnected, reason:", reason);
            setIsConnected(false);
            
            // Handle reconnection attempts
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setReconnectAttempts(prev => prev + 1);
              console.log(`[SOCKET] Attempting reconnection (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            } else {
              setConnectionError("Failed to reconnect after multiple attempts");
            }
          });

          socketClient.on("connect_error", (error) => {
            console.error("[SOCKET] Connection error:", error);
            setConnectionError(error.message);
            setIsConnected(false);
          });

          // Add tracking-specific event handlers
          socketClient.on("startTracking", (data) => {
            console.log("[SOCKET] Start tracking received for consignment:", data.consignmentId);
            // Join the tracking room for this consignment
            socketClient.emit("joinTracking", { 
              consignmentId: data.consignmentId,
              travelId: data.travelId
            });
          });

          socketClient.on("stopTracking", (data) => {
            console.log("[SOCKET] Stop tracking received for consignment:", data.consignmentId);
            // Leave the tracking room
            socketClient.emit("leaveTracking", { 
              consignmentId: data.consignmentId,
              travelId: data.travelId
            });
          });

          socketClient.on("locationUpdate", (data) => {
            console.log("[SOCKET] Location update received:", data);
            // The location update will be handled by the tracking service
          });

          setSocket(socketClient);
        } else {
          console.warn(
            "SocketProvider: Missing apiBaseUrl or phoneNumber in AsyncStorage",
            { apiBaseUrl, phoneNumber }
          );
          setConnectionError("Missing configuration: apiBaseUrl or phoneNumber");
        }
      } catch (error) {
        console.error("SocketProvider: Error initializing socket:", error);
        setConnectionError(error.message);
      }
    };

    initializeSocket();

    return () => {
      if (socketClient) {
        console.log("SocketProvider: Disconnecting socket on cleanup");
        socketClient.disconnect();
      }
    };
  }, []);

  // Log context value for debugging
  useEffect(() => {
    console.log("SocketProvider: Providing context value:", {
      socket: !!socket,
      isConnected,
      connectionError,
    });
  }, [socket, isConnected, connectionError]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};