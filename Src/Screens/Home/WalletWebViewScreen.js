import React from "react";
import { WebView } from "react-native-webview";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { apiBaseUrl } from "../../App";
const WebViewScreen = ({ route, navigation }) => {
  // Safely destructure params with defaults to avoid undefined
  const {
    orderId = "",
    amount = 0,
    phoneNumber = "",
    userName = "",
    userEmail = "timestringsystems@gmail.com",
    travelId = "",
    keyId = "",
  } = route?.params || {};

  console.log("WebViewScreen params:", {
    orderId,
    amount,
    phoneNumber,
    userName,
    userEmail,
    travelId,
    keyId,
  });

  const verifyPayment = async (paymentData) => {
    try {
      // Validate payment data
      if (
        !paymentData?.payment_id ||
        !paymentData?.order_id ||
        !paymentData?.signature
      ) {
        throw new Error("Invalid payment data received.");
      }

      // Use the verification phone number based on notification type
      const verificationPhoneNumber =
        route.params?.verificationPhoneNumber ;

      // Get consignmentId from route params
      const consignmentId = route.params?.consignmentId;

      console.log(
        "Using phone number for verification:",
        verificationPhoneNumber,
        "Consignment ID:",
        consignmentId
      );

      // Extract totalFare and senderTotalPay from route params if available
      let totalFare = null;
      let senderTotalPay = null;
      
      if (route.params?.notification && route.params.notification.amount && typeof route.params.notification.amount === 'object') {
        totalFare = route.params.notification.amount.totalFare;
        senderTotalPay = route.params.notification.amount.senderTotalPay;
      }

      console.log("Making payment verification request")
      const baseUrl = await AsyncStorage.getItem("apiBaseUrl")
      const response = await fetch(
        `${baseUrl}p/verify-payment`,
        // `https://travel.timestringssystem.com/p/verify-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentData.payment_id,
            razorpay_order_id: orderId,
            razorpay_signature: paymentData.signature,
            phoneNumber: verificationPhoneNumber,
            travelId: travelId,
            consignmentId: consignmentId || null,
            amount: parseFloat(amount) || 0,
            totalFare: totalFare ? parseFloat(totalFare) : null,
            senderTotalPay: senderTotalPay ? parseFloat(senderTotalPay) : null,
          }),
        }
      );

      const result = await response.json();
      console.log("Verify payment response:", result);

      if (response.ok && result.success === true) {
        const paidNotifications = JSON.parse(
          (await AsyncStorage.getItem("paidNotifications")) || "{}"
        );
        // Use combination of travelId and consignmentId as key to avoid conflicts
        const paymentKey = consignmentId ? `${travelId}_${consignmentId}` : travelId;
        paidNotifications[paymentKey] = true;
        await AsyncStorage.setItem(
          "paidNotifications",
          JSON.stringify(paidNotifications)
        );
                Alert.alert("Success", "Payment verified successfully!");
        // Navigate back to main screen and clear navigation stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'Navigation' }],
        });
      } else {
        throw new Error(result.message || "Payment verification failed.");
      }
    } catch (error) {
      console.error("Verify payment error:", error);
      Alert.alert("Error", error.message || "Failed to verify payment.");
      navigation.goBack();
    }
  };

  // Ensure amount is a valid number, default to 0 if invalid
  const safeAmount = isNaN(parseFloat(amount))
    ? 0
    : Math.round(parseFloat(amount));

  // Sanitize strings to prevent undefined or injection issues
  const safeUserName = (userName || "").replace(/"/g, '\\"');
  const safeUserEmail = (userEmail || "").replace(/"/g, '\\"');
  const safeTravelId = (travelId || "").replace(/"/g, '\\"');
  const safePhoneNumber = (phoneNumber || "").replace(/"/g, '\\"');
  const safeOrderId = (orderId || "").replace(/"/g, '\\"');
  const safeKeyId = (keyId || "").replace(/"/g, '\\"');

  const razorpayHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <script>
          try {
            var options = {
              key: "${safeKeyId}",
              amount: ${safeAmount},
              currency: "INR",
              name: "${safeUserName}",
              description: "Payment for Travel ID: ${safeTravelId}",
              order_id: "${safeOrderId}",
              handler: function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  payment_id: response.razorpay_payment_id || "",
                  order_id: response.razorpay_order_id || "",
                  signature: response.razorpay_signature || "",
                  status: "success"
                }));
              },
              prefill: {
                name: "${safeUserName}",
                email: "${safeUserEmail}",
                contact: "${safePhoneNumber}"
              },
              theme: {
                color: "#4CAF50"
              },
              method: {
                wallet: true,
                card: true,
                netbanking: true,
                upi: true
              }
            };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                error: response.error?.description || "Payment failed",
                code: response.error?.code || "",
                status: "failed"
              }));
            });
            rzp.open();
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              error: error.message || "Checkout initialization failed",
              status: "failed"
            }));
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ html: razorpayHtml }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data || "{}");
            console.log("WebView message:", data);
            // console.log(JSON.stringify(data, null, 2))
            if (data.status === "success") {
              console.log("Payment successful")
              verifyPayment(data);
            } else if (data.status === "failed") {
              Alert.alert("Payment Failed", data.error || "Checkout error");
              navigation.goBack();
            } else {
              throw new Error("Invalid response from WebView.");
            }
          } catch (error) {
            console.error("WebView message error:", error);
            
            Alert.alert("Error", "Failed to process payment response", );
            navigation.goBack();
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
          Alert.alert("Error", "Failed to load checkout");
          navigation.goBack();
        }}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;