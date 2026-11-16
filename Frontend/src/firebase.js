import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDDgRoIkUPYpCFiCLgExj6UHf96lGgqqs8",
  authDomain: "devnexus-ec954.firebaseapp.com",
  projectId: "devnexus-ec954",
  storageBucket: "devnexus-ec954.firebasestorage.app",
  messagingSenderId: "470483590221",
  appId: "1:470483590221:web:5813e07430d7335237d004"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Helper function to request permission and get the FCM token
export const requestFirebaseNotificationPermission = async (vapidKey) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey });
      return token;
    } else {
      throw new Error("Notification permission denied");
    }
  } catch (error) {
    console.error("Firebase token generation failed:", error);
    return null;
  }
};