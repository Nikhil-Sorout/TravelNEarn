import React, { createContext, useEffect, useState } from "react";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SocketContext = createContext({
  socket: null,
  notifications: [],
  setNotifications: () => {
    console.error(
      "setNotifications called on default context. Ensure SocketProvider wraps your app and the import path '../../Context/socketprovider' is correct."
    );
  },
  unreadCount: 0,
  setUnreadCount: () => {
    console.error(
      "setUnreadCount called on default context. Ensure SocketProvider wraps your app and the import path '../../Context/socketprovider' is correct."
    );
  },
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log("SocketProvider: Initializing socket...");
    let socketClient = null;

    const initializeSocket = async () => {
      try {
        const apiBaseUrl = await AsyncStorage.getItem("apiBaseUrl");
        const phoneNumber = await AsyncStorage.getItem("phoneNumber");

        if (apiBaseUrl && phoneNumber) {
          console.log("SocketProvider: Connecting to", apiBaseUrl, "with phoneNumber", phoneNumber);
          socketClient = io(apiBaseUrl, {
            query: { phoneNumber },
            transports: ["websocket"],
          });

          socketClient.on("connect", () => {
            console.log("SocketProvider: Socket connected, ID:", socketClient.id);
          });

          socketClient.on("disconnect", () => {
            console.log("SocketProvider: Socket disconnected");
          });

          socketClient.on("connect_error", (error) => {
            console.error("SocketProvider: Socket connection error:", error);
          });

          socketClient.on("sendnotification", (data) => {
            console.log("SocketProvider: Received real-time notification:", data);

            if (data && data.notification && data.notification.message) {
              const newNotification = {
                title: data.notification.message,
                subtitle: `New booking request (ID: ${
                  data.notification.consignmentId || data.notification.travelId || "N/A"
                })`,
                consignmentId: data.notification.consignmentId || "N/A",
                travelId: data.notification.travelId || "N/A",
                notificationType:
                  data.notification.notificationType === "booking"
                    ? "consignment_request"
                    : "general",
                createdAt: new Date(data.notification.createdAt || Date.now()),
                time: new Date(data.notification.createdAt || Date.now()).toLocaleTimeString(),
                isUnread: true,
              };

              setNotifications((prevNotifications) => {
                console.log("SocketProvider: Adding new notification:", newNotification);
                return [newNotification, ...prevNotifications];
              });
              setUnreadCount((prev) => {
                console.log("SocketProvider: Incrementing unreadCount to", prev + 1);
                return prev + 1;
              });
            } else {
              console.warn("SocketProvider: Invalid notification format:", data);
            }
          });

          setSocket(socketClient);
        } else {
          console.warn(
            "SocketProvider: Missing apiBaseUrl or phoneNumber in AsyncStorage",
            { apiBaseUrl, phoneNumber }
          );
        }
      } catch (error) {
        console.error("SocketProvider: Error initializing socket:", error);
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

  useEffect(() => {
    const newUnreadCount = notifications.filter((n) => n.isUnread).length;
    console.log("SocketProvider: Updating unreadCount to", newUnreadCount, "based on notifications");
    setUnreadCount(newUnreadCount);
  }, [notifications]);

  // Log context value for debugging
  useEffect(() => {
    console.log("SocketProvider: Providing context value:", {
      socket: !!socket,
      notifications: notifications.length,
      setNotifications: typeof setNotifications,
      unreadCount,
      setUnreadCount: typeof setUnreadCount,
    });
  }, [socket, notifications, unreadCount]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};