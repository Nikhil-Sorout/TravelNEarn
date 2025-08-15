import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSocket } from "../../Context/socketprovider";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import moment from "moment";
import { 
  scale, 
  verticalScale, 
  moderateScale, 
  responsiveFontSize,
  responsiveDimensions,
  screenWidth,
  screenHeight,
  responsivePadding
} from "../../Utils/responsive";

const NotificationsScreen = ({ navigation, route }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("travel");
  const [previousNotifications, setPreviousNotifications] = useState([]);
  const [paidNotifications, setPaidNotifications] = useState({});
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    const loadPhoneNumber = async () => {
      try {
        let storedPhoneNumber = await AsyncStorage.getItem("phoneNumber");
        if (!storedPhoneNumber && route.params?.phoneNumber) {
          storedPhoneNumber = route.params.phoneNumber;
          await AsyncStorage.setItem("phoneNumber", storedPhoneNumber);
        }
        if (!storedPhoneNumber) {
          setError("Phone number not found. Please log in again.");
          setLoading(false);
        } else {
          setPhoneNumber(storedPhoneNumber);
        }
      } catch (err) {
        setError("Failed to load phone number.");
        setLoading(false);
      }
    };
    loadPhoneNumber();
  }, [route.params?.phoneNumber]);

  useEffect(() => {
    if (socket && phoneNumber) {
      socket.on("sendnotification", (data) => {
        if (data && data.message) {
          const newNotification = {
            title: data.message,
            subtitle: `New booking request (Earning: $${data.expectedEarning?.toFixed(2)})`,
            consignmentId: data.consignmentId || "N/A",
            travelId: data.travelId || "N/A",
            notificationType: data.type === "booking_request" ? "consignment_request" : "general",
            createdAt: new Date(data.timestamp || Date.now()),
            time: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
            isUnread: true,
            amount: data.amount || data.expectedEarning || "0.00",
          };

          setNotifications((prevNotifications) => [
            newNotification,
            ...prevNotifications,
          ]);
          setUnreadCount((prev) => prev + 1);
        }
      });

      socket.on("connect_error", (error) => {
        setError("Failed to connect to notification server.");
      });

      return () => {
        socket.off("sendnotification");
        socket.off("connect_error");
      };
    }
  }, [socket, phoneNumber]);

  useEffect(() => {
    const loadPaidNotifications = async () => {
      try {
        const storedPaid = await AsyncStorage.getItem("paidNotifications");
        if (storedPaid) {
          setPaidNotifications(JSON.parse(storedPaid));
        }
      } catch (err) {
        // Handle error silently
      }
    };
    loadPaidNotifications();
  }, [route.params?.paymentSuccess]);

  useEffect(() => {
    const savePaidNotifications = async () => {
      try {
        await AsyncStorage.setItem(
          "paidNotifications",
          JSON.stringify(paidNotifications)
        );
      } catch (err) {
        // Handle error silently
      }
    };
    savePaidNotifications();
  }, [paidNotifications]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!phoneNumber) return;

      try {
        setLoading(true);
        setError(null);
        const baseUrl = await AsyncStorage.getItem('apiBaseUrl')
        // const baseUrl = "http://192.168.1.30:5002/"
        const endpoint = `${baseUrl}n/getnotification/${activeTab}/${phoneNumber}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        if (data && Array.isArray(data.notifications)) {

          const lastReadTime = await AsyncStorage.getItem("lastNotificationReadTime");
          const shouldMarkAsRead = route.params?.markAsRead === true;

          const processedNotifications = data.notifications.map((notif) => {
            const isUnread = shouldMarkAsRead
              ? false
              : !lastReadTime
              ? true
              : new Date(notif.createdAt || Date.now()) > new Date(lastReadTime);

            const notificationAmount =
              notif.amount || notif.earning || notif.expectedEarning || notif.rideDetails?.amount || "0.00";

            return {
              ...notif,
              isUnread,
              amount: notificationAmount,
              rideDetails: { ...notif.rideDetails, amount: notificationAmount },
              paymentstatus: notif.paymentstatus || "pending",
            };
          });

          // Load stored payment success notifications
          let storedPaymentNotifications = {};
          try {
            const stored = await AsyncStorage.getItem("paymentSuccessNotifications");
            if (stored) {
              storedPaymentNotifications = JSON.parse(stored);
            }
          } catch (err) {
            // Handle error silently
          }

          // Handle payment success from WebViewScreen for Consignment tab
          if (route.params?.paymentSuccess && route.params?.travelId && activeTab === "consignment") {
            const paymentSuccessNotification = {
              title: "Payment Successful",
              subtitle: `You have successfully paid amount ₹${parseFloat(route.params?.amount || "0").toFixed(2)}`,
              time: new Date().toLocaleTimeString(),
              notificationType: "payment_success",
              consignmentId: route.params?.consignmentId || "N/A",
              travelId: route.params?.travelId,
              createdAt: new Date().toISOString(),
              isUnread: false,
              paymentstatus: "successful",
            };

            // Update paidNotifications
            setPaidNotifications((prev) => ({
              ...prev,
              [route.params.travelId]: true,
            }));

            // Store payment success notification
            storedPaymentNotifications[route.params.travelId] = paymentSuccessNotification;
            try {
              await AsyncStorage.setItem(
                "paymentSuccessNotifications",
                JSON.stringify(storedPaymentNotifications)
              );
            } catch (err) {
              console.error("Error saving payment success notification:", err);
            }

            processedNotifications.unshift(paymentSuccessNotification);
          }

          // Append stored payment success notifications for Consignment tab
          if (activeTab === "consignment") {
            Object.values(storedPaymentNotifications).forEach((notif) => {
              if (!processedNotifications.some((n) => n.travelId === notif.travelId)) {
                processedNotifications.unshift(notif);
              }
            });
          }

          setNotifications(processedNotifications);
          setPreviousNotifications(data.notifications);

          if (shouldMarkAsRead && data.notifications.length > 0) {
            try {
              await fetch(
                `${baseUrl}n/mark-read/${phoneNumber}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    notificationIds: data.notifications.map((n) => n.id || n._id),
                  }),
                }
              );
              setUnreadCount(0);
            } catch (err) {
              console.error("Error marking notifications as read:", err);
            }
          } else {
            setUnreadCount(processedNotifications.filter((n) => n.isUnread).length);
          }
        } else {
          console.log("No valid notifications array:", data);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (err) {
        setError("Error fetching notifications.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [activeTab, phoneNumber, route.params?.refresh, route.params?.markAsRead, route.params?.paymentSuccess]);

  const verifyPayment = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    phoneNumber: paymentPhoneNumber,
    amount,
    travelId,
    title = "Ride Payment",
    notification = null,
  }) => {
    console.log("Verifying payment for Travel ID:", travelId);
    try {
      const finalPhoneNumber = paymentPhoneNumber || phoneNumber;
      if (!finalPhoneNumber || !/^\d{10}$/.test(finalPhoneNumber)) {
        throw new Error("Invalid phone number format.");
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error("Missing payment details.");
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      // Extract totalFare and senderTotalPay from notification if available
      let totalFare = null;
      let senderTotalPay = null;
      
      if (notification && notification.amount && typeof notification.amount === 'object') {
        totalFare = notification.amount.totalFare;
        senderTotalPay = notification.amount.senderTotalPay;
      }

      console.log("Verifying payment with:", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        phoneNumber: finalPhoneNumber,
        amount: amountNum,
        totalFare,
        senderTotalPay,
        travelId,
        title,
      });

      const baseUrl = await AsyncStorage.getItem("apiBaseUrl");
      const response = await fetch(
        `${baseUrl}p/verify-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            phoneNumber: finalPhoneNumber,
            amount: amountNum,
            totalFare: totalFare ? parseFloat(totalFare) : null,
            senderTotalPay: senderTotalPay ? parseFloat(senderTotalPay) : null,
            travelId: travelId || "N/A",
            title,
          }),
        }
      );

      const json = await response.json();
      console.log("Payment verification response:", JSON.stringify(json, null, 2));

      if (!response.ok) {
        throw new Error(`Server error: ${json.message || "Unknown error"}`);
      }

      if (json.success) {
        Alert.alert("Success", "Payment verified successfully");

        const notificationId = travelId || `placeholder-${Date.now()}`;
        setPaidNotifications((prev) => ({
          ...prev,
          [notificationId]: true,
        }));

        const paymentSuccessNotification = {
          title: "Payment Successful",
          subtitle: `Payment of ₹${amountNum.toFixed(2)} for ${title} completed.`,
          time: new Date().toLocaleTimeString(),
          notificationType: "payment_success",
          consignmentId: travelId,
          travelId: travelId,
          createdAt: new Date().toISOString(),
          isUnread: false,
          paymentstatus: "successful",
        };

        setNotifications((prevNotifications) => [
          paymentSuccessNotification,
          ...prevNotifications.filter(
            (n) => n.title !== "Consignment Approved" || n.travelId !== travelId
          ),
        ]);

        const endpoint = `https://travel.timestringssystem.com/n/getnotification/${activeTab}/${finalPhoneNumber}`;
        const res = await fetch(endpoint);
        console.log("Not" + res);

        if (res.ok) {
          const result = await res.json();
          if (result && Array.isArray(result.notifications)) {
            setNotifications(
              result.notifications.map((notif) => ({
                ...notif,
                isUnread: false,
                paymentstatus: notif.paymentstatus,
              }))
            );
            setPreviousNotifications(result.notifications);
            setUnreadCount(0);
          }
        }

        navigation.navigate("NotificationsScreen", { refresh: true, travelId });
      } else {
        throw new Error(json.message || "Payment verification failed.");
      }
    } catch (error) {
      console.error("Verify payment error:", error);
      throw error;
    }
  };


  const formatTime = (date)=>{
    const localTime = moment.utc(date).local().format("h:mm A");
    return localTime;
  }

  const handleDecline = async (consignmentId, travelId) => {
    console.log("Declining Consignment ID:", consignmentId, "Travel ID:", travelId);
    try {
      const baseurl = await AsyncStorage.getItem("apiBaseUrl");
      if (!baseurl) {
        throw new Error("Base URL not found in AsyncStorage.");
      }

      if (!phoneNumber) {
        throw new Error("Phone number not found.");
      }

      const finalConsignmentId = consignmentId || `placeholder-${Date.now()}`;
      const finalTravelId = travelId || "N/A";
      console.warn(
        "Using consignmentId for decline:",
        finalConsignmentId,
        "travelId:",
        finalTravelId
      );

      const response = await fetch(
        `${baseurl}api/decline-consignment/${phoneNumber}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consignmentId: finalConsignmentId,
            travelId: finalTravelId,
            response: 'decline',
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Consignment request declined");

        const endpoint = `${baseurl}n/getnotification/${activeTab}/${phoneNumber}`;
        const res = await fetch(endpoint);
        const result = await res.json();
        if (result && Array.isArray(result.notifications)) {
          setNotifications(
            result.notifications.map((notif) => ({
              ...notif,
              isUnread: false,
              paymentstatus: notif.paymentstatus || "pending",
            }))
          );
          setPreviousNotifications(result.notifications);
          setUnreadCount(0);
        }
      } else {
        throw new Error(data.message || "Failed to decline consignment.");
      }
    } catch (error) {
      console.error("Decline error:", error);
      Alert.alert("Error", error.message || "Failed to decline consignment.");
    }
  };

  // Function to escape special characters for text rendering
  const escapeText = (str) => {
    if (!str) return "N/A";
    return str.replace(/[^\w\s.-]/g, "");
  };

  // Function to generate and save PDF
  const generateAndSavePDF = async (item) => {
    try {
      const receiptDetails = {
        pickup: escapeText(item.pickup),
        dropoff: escapeText(item.dropoff),
        travelmode: escapeText(item.travelmode),
        pickuptime: escapeText(item.pickuptime),
        dropofftime: escapeText(item.dropofftime),
        amount: escapeText(item.amount),
      };

      console.log("Generating PDF with details:", receiptDetails);

      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center;">Payment Receipt</h1>
            <p><strong>Going Location:</strong> ${receiptDetails.pickup}</p>
            <p><strong>Leaving Location:</strong> ${receiptDetails.dropoff}</p>
            <p><strong>Travel Mode:</strong> ${receiptDetails.travelmode}</p>
            <p><strong>Estimated Start Time:</strong> ${receiptDetails.pickuptime}</p>
            <p><strong>Estimated End Time:</strong> ${receiptDetails.dropofftime}</p>
            <p><strong>Amount:</strong> ${receiptDetails.amount}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `PaymentReceipt_${item.travelId || Date.now()}.pdf`;
      const finalPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.moveAsync({ from: uri, to: finalPath });

      console.log("PDF saved to:", finalPath);

      // Check if sharing is available and share the PDF
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(finalPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share Payment Receipt',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert("Success", "PDF generated and sharing dialog opened.");
      } else {
        Alert.alert("Success", `PDF saved to ${finalPath}, but sharing is not available on this device.`);
      }

      return finalPath;
    } catch (error) {
      console.error("Error generating or saving PDF:", error);
      Alert.alert("Error", "Failed to generate or save PDF.");
      return null;
    }
  };

  if (loading || !phoneNumber) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#D83F3F" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={responsiveDimensions.icon.medium} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "travel" && styles.activeTab]}
          onPress={() => setActiveTab("travel")}
        >
          <Text
            style={[styles.tabText, activeTab === "travel" && styles.activeTabText]}
          >
            Travel Updates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "consignment" && styles.activeTab]}
          onPress={() => setActiveTab("consignment")}
        >
          <Text
            style={[styles.tabText, activeTab === "consignment" && styles.activeTabText]}
          >
            Consignment Updates
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notificationsList}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : notifications.length === 0 ? (
          <Text style={styles.noDataText}>No notifications found.</Text>
        ) : (
          notifications.map((item, index) => {
            const verificationPhoneNumber =
              item.notificationType === "consignment_accept"
                ? item.requestto
                : item.notificationType === "ride_accept"
                ? item.requestedby
                : phoneNumber;



            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (item.notificationType === "consignment_request") {
                    if (!item.consignmentId || item.consignmentId === "N/A") {
                      Alert.alert(
                        "Error",
                        "Consignment ID is missing. Please try again later."
                      );
                      return;
                    }

                    navigation.navigate("ConsignmentPayRequest", {
                      consignmentId: item.consignmentId,
                      travelId: item.travelId || "N/A",
                      phoneNumber,
                      profilepicture: item.profilepicture,
                    });
                  } else if (item.notificationType === "ride_request") {
                    if (!item.travelId || item.travelId === "N/A") {
                      Alert.alert(
                        "Error",
                        "Travel ID is missing. Please try again later."
                      );
                      return;
                    }

                    navigation.navigate("TravelPayRequest", {
                      consignmentId: item.consignmentId || "N/A",
                      travelId: item.travelId,
                      phoneNumber: item.requestedby,
                    });
                  }
                }}
              >
                <View
                  style={[
                    styles.notificationItem,
                    item.isUnread && styles.unreadNotification,
                  ]}
                >
                  <View style={styles.notificationTextContainer}>
                    <Text style={styles.notificationTitle}>
                      {item.title || item.message || "Untitled"}
                    </Text>
                    <Text style={styles.notificationSubtitle}>
                      {item.subtitle || item.description || "No details"}
                    </Text>
                  </View>
                  <Text style={styles.notificationTime}>
                    {formatTime(item.createdAt)}
                  </Text>
                  {/* <Text style={styles.notificationTime}>
                    {item.time ||
                      (item.createdAt &&
                        new Date(item.createdAt).toLocaleTimeString()) ||
                      new Date().toLocaleTimeString()}
                  </Text> */}

                  {(item.title === "Consignment Accepted" ||
                    item.title === "Ride Request accept") &&
                    !paidNotifications[item.travelId] &&
                    item.paymentstatus !== "successful" && item.paymentstatus !== "declined" && (
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.payButton}
                          onPress={() => {
                            const finalConsignmentId =
                              item.consignmentId || `consignment-${item.travelId || Date.now()}`;

                            if (!item.consignmentId || item.consignmentId === "N/A") {
                              Alert.alert(
                                "Error",
                                "Consignment ID is missing. Please try again later."
                              );
                              return;
                            }
                            let totalAmount = 0;
                            console.log("Notification item amount structure:", JSON.stringify(item.amount, null, 2));
                            console.log("Notification title:", item.title);
                            
                            if(item.title === "Consignment Accepted" || item.title === "Ride Request accept") {
                              // For consignment accepted, show sender's total pay
                              if (item.amount && typeof item.amount === 'object' && item.amount.senderTotalPay) {
                                totalAmount = item.amount.senderTotalPay;
                              } else if (item.amount && typeof item.amount === 'object' && item.amount.totalFare) {
                                totalAmount = item.amount.totalFare;
                              } else if (typeof item.amount === 'string' || typeof item.amount === 'number') {
                                totalAmount = item.amount;
                              }
                            } else {
                              // For other notifications (ride requests), show total fare
                              if (item.amount && typeof item.amount === 'object' && item.amount.totalFare) {
                                totalAmount = item.amount.totalFare;
                              } else if (typeof item.amount === 'string' || typeof item.amount === 'number') {
                                totalAmount = item.amount;
                              }
                            }
                            
                            console.log("Calculated totalAmount:", totalAmount);
                            if (!totalAmount || isNaN(parseFloat(totalAmount))) {
                              Alert.alert(
                                "Error",
                                "Amount is missing or invalid. Please try again later."
                              );
                              return;
                            }



                            navigation.navigate("PayNowScreen", {
                              consignmentId: finalConsignmentId,
                              travelId: item.travelId || "N/A",
                              phoneNumber,
                              amount: totalAmount,
                              notification: item,
                              travelmode: item.travelmode,
                              pickup: item.pickup,
                              dropoff: item.dropoff,
                              pickuptime: item.pickuptime,
                              dropofftime: item.dropofftime,
                              travellername: item.travellername,
                              requestTo: item.requestto,
                              requestedBy: item.requestedby,
                              verificationPhoneNumber: verificationPhoneNumber,
                              notificationType: item.notificationType,
                              profilepicture: item.profilepicture,
                            });
                          }}
                        >
                          <Text style={styles.buttonText}>Pay Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.declineButton}
                          onPress={() => handleDecline(item.consignmentId, item.travelId)}
                        >
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                  {(item.title === "Consignment Accepted" ||
                    item.title === "Ride Request accept") &&
                    (paidNotifications[item.travelId] || item.paymentstatus === "successful") && (
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.successButton}
                          onPress={() => {
                            const receiptDetails = {
                              pickup: item.pickup || "N/A",
                              dropoff: item.dropoff || "N/A",
                              travelmode: item.travelmode || "N/A",
                              pickuptime: item.pickuptime || "N/A",
                              dropofftime: item.dropofftime || "N/A",
                              amount: item.amount || "N/A",
                            };

                            // Extract specific amounts for consignment vs travel
                            let consignmentOwnerAmount = "N/A";
                            let travelerAmount = "N/A";
                            
                            if (item.title === "Consignment Accepted" && item.amount) {
                              if (typeof item.amount === 'object') {
                                consignmentOwnerAmount = item.amount.senderTotalPay || "N/A";
                                travelerAmount = item.amount.totalFare || "N/A";
                              } else {
                                // If amount is a simple value, use it for both
                                consignmentOwnerAmount = item.amount;
                                travelerAmount = item.amount;
                              }
                            } else if (item.title === "Ride Request accept" && item.amount) {
                              if (typeof item.amount === 'object') {
                                travelerAmount = item.amount.totalFare || item.amount || "N/A";
                              } else {
                                travelerAmount = item.amount;
                              }
                            }

                            Alert.alert(
                              "Payment Receipt",
                              `Going Location: ${receiptDetails.pickup}\n` +
                              `Leaving Location: ${receiptDetails.dropoff}\n` +
                              `Travel Mode: ${receiptDetails.travelmode}\n` +
                              `Estimated Start Time: ${receiptDetails.pickuptime}\n` +
                              `Estimated End Time: ${receiptDetails.dropofftime}\n` +
                              `${item.title === "Consignment Accepted" ? 
                                `Total Amount: ₹${consignmentOwnerAmount}\n` :
                                `Total Amount: ₹${travelerAmount}`
                              }`,
                              [
                                { text: "OK", style: "cancel" },
                                {
                                  text: "Download PDF",
                                  onPress: async () => {

                                    await generateAndSavePDF(item);
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={styles.buttonText}>payment has done Successfully</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                  {(item.title === "Consignment Accepted" ||
                    item.title === " Ride Request accept") &&
                    (!paidNotifications[item.travelId] && item.paymentstatus === "declined") && (
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={[styles.successButton, {backgroundColor: 'darkred'}]}
                          // onPress={() => {
                          //   const receiptDetails = {
                          //     pickup: item.pickup || "N/A",
                          //     dropoff: item.dropoff || "N/A",
                          //     travelmode: item.travelmode || "N/A",
                          //     pickuptime: item.pickuptime || "N/A",
                          //     dropofftime: item.dropofftime || "N/A",
                          //     amount: item.amount || "N/A",
                          //   };

                          //   // Extract specific amounts for consignment vs travel
                          //   let consignmentOwnerAmount = "N/A";
                          //   let travelerAmount = "N/A";
                          //   
                          //   if (item.title === "Consignment Accepted" && item.amount) {
                          //     if (typeof item.amount === 'object') {
                          //       consignmentOwnerAmount = item.amount.senderTotalPay || "N/A";
                          //       travelerAmount = item.amount.totalFare || "N/A";
                          //     } else {
                          //       consignmentOwnerAmount = item.amount;
                          //       travelerAmount = item.amount;
                          //     }
                          //   } else if (item.title === "Ride Request accept" && item.amount) {
                          //     if (typeof item.amount === 'object') {
                          //       travelerAmount = item.amount.totalFare || item.amount || "N/A";
                          //     } else {
                          //       travelerAmount = item.amount;
                          //     }
                          //   }

                          //   Alert.alert(
                          //     "Payment Receipt",
                          //     `Going Location: ${receiptDetails.pickup}\n` +
                          //     `Leaving Location: ${receiptDetails.dropoff}\n` +
                          //     `Travel Mode: ${receiptDetails.travelmode}\n` +
                          //     `Estimated Start Time: ${receiptDetails.pickuptime}\n` +
                          //     `Estimated End Time: ${receiptDetails.dropofftime}\n` +
                          //     `${item.title === "Consignment Accepted" ? 
                          //       `Consignment Owner Pay: ₹${consignmentOwnerAmount}\n` +
                          //       `Traveler Fare: ₹${travelerAmount}` :
                          //       `Total Amount: ₹${travelerAmount}`
                          //     }`,
                          //     [
                          //       { text: "OK", style: "cancel" },
                          //       {
                          //         text: "Download PDF",
                          //         onPress: async () => {
                          //           console.log("Initiating PDF download for receipt:", receiptDetails);
                          //           await generateAndSavePDF(item);
                          //         },
                          //       },
                          //     ]
                          //   );
                          // }}
                        >
                          <Text style={[styles.buttonText]}>You have declined the payment</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  noDataText: {
    textAlign: "center",
    marginTop: verticalScale(20),
    color: "grey",
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#D83F3F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(15),
    paddingHorizontal: responsivePadding.small,
    elevation: scale(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "white",
    fontSize: responsiveFontSize.lg,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "#FFD700",
    borderRadius: scale(12),
    width: scale(24),
    height: scale(24),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale(8),
  },
  badgeText: {
    color: "#000",
    fontSize: responsiveFontSize.xs,
    fontWeight: "bold",
  },
  backButton: {
    marginRight: responsivePadding.small,
    padding: scale(8),
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: verticalScale(20),
    margin: responsivePadding.small,
    borderWidth: scale(2),
    borderColor: "#7C7C7C",
    borderRadius: scale(5),
    maxWidth: scale(350),
    alignSelf: "center",
    width: screenWidth < 375 ? "95%" : "90%",
  },
  tab: {
    flex: 1,
    padding: verticalScale(12),
    alignItems: "center",
    borderBottomWidth: scale(3),
    borderBottomColor: "transparent",
    minHeight: verticalScale(44),
  },
  activeTab: {
    backgroundColor: "#A4CE39",
    color: "white",
  },
  tabText: {
    fontSize: responsiveFontSize.sm,
    color: "#7C7C7C",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  notificationsList: {
    padding: responsivePadding.medium,
    paddingHorizontal: screenWidth < 375 ? responsivePadding.small : responsivePadding.medium,
  },
  notificationItem: {
    flexDirection: "column",
    paddingVertical: verticalScale(15),
    borderLeftWidth: scale(5),
    borderLeftColor: "#53B175",
    borderRadius: scale(8),
    backgroundColor: "#fff",
    padding: responsivePadding.medium,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: scale(3),
    marginBottom: verticalScale(10),
    marginHorizontal: screenWidth < 375 ? scale(5) : 0,
  },
  unreadNotification: {
    backgroundColor: "#E6F3FF",
    borderLeftColor: "#007BFF",
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: responsiveFontSize.md,
    fontWeight: "bold",
    color: "#333",
    lineHeight: moderateScale(20),
  },
  notificationSubtitle: {
    color: "#333",
    marginTop: verticalScale(5),
    fontSize: responsiveFontSize.sm,
    lineHeight: moderateScale(18),
  },
  notificationTime: {
    color: "#888",
    fontSize: responsiveFontSize.sm,
    alignSelf: "flex-end",
    marginTop: verticalScale(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: verticalScale(20),
    fontSize: responsiveFontSize.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: verticalScale(15),
    gap: scale(10),
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    flex: 1,
    alignItems: "center",
    minHeight: verticalScale(44),
    elevation: scale(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
  },
  successButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    flex: 1,
    alignItems: "center",
    minHeight: verticalScale(44),
    elevation: scale(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
  },
  declineButton: {
    backgroundColor: "#fff",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    borderWidth: scale(1),
    borderColor: "#F44336",
    flex: 1,
    alignItems: "center",
    minHeight: verticalScale(44),
    elevation: scale(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(1),
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: moderateScale(14),
  },
  declineButtonText: {
    color: "#F44336",
    fontWeight: "bold",
    fontSize: moderateScale(14),
  },
});

export default NotificationsScreen;