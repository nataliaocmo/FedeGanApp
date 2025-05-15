import { Redirect } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function Index() {
  // For web, ensure Redirect only runs in the browser
  if (Platform.OS === "web" && typeof window === "undefined") {
    return null; // Prevent rendering during SSR
  }

  return <Redirect href="/auth/Login" />;
}