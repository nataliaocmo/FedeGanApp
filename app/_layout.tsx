import { AuthProvider } from "@/context/authContext/AuthContext"; // Asegúrate de que la ruta sea correcta
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} >
            <Stack.Screen name="farmManagerMenu/index" options={{ title: "Menu del Administrador de Finca" }} />
            <Stack.Screen name="fedeganManagerMenu/index" options={{ title: "Menu del Administrador de FEDEGAN" }} />
            <Stack.Screen name="vaccinationAgentMenu/index" options={{ title: "Menu del Vacunador" }} />
            </Stack>
        </AuthProvider>
    );
}