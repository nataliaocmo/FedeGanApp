import { AuthProvider } from "@/context/authContext/AuthContext"; // Asegúrate de que la ruta sea correcta
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} >
            <Stack.Screen name="auth/Login" options={{ title: "Inicio de sesión" }} />
            <Stack.Screen name="auth/Register" options={{ title: "Registro" }} />
            
            <Stack.Screen name="farmManagerMenu/index" options={{ title: "Menu del Administrador de Finca" }} />

            <Stack.Screen name="fedeganManagerMenu/index" options={{ title: "Menu del Administrador de FEDEGAN" }} />
            <Stack.Screen name="fedeganManagerMenu/outbreak_Screen" options={{ title: "Fincas y animales" }} />
            <Stack.Screen name="fedeganManagerMenu/Campaigns_Screen" options={{ title: "Campañas" }} />
            <Stack.Screen name="fedeganManagerMenu/Settings_Screen" options={{ title: "Ajustes" }} />

            <Stack.Screen name="vaccinationAgentMenu/index" options={{ title: "Menu del Vacunador" }} />
            <Stack.Screen name="vaccinationAgentMenu/farmsAndAnimals_Screen" options={{ title: "Fincas y animales" }} />
            <Stack.Screen name="vaccinationAgentMenu/campaigns_Screen" options={{ title: "Campañas" }} />
            <Stack.Screen name="vaccinationAgentMenu/settings_Screen" options={{ title: "Ajustes" }} />

            </Stack>
        </AuthProvider>
    );
}