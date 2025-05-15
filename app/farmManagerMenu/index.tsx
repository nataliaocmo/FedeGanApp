// App.tsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CommerceMenu from "./commerce/menu";
//import  from "./campaigns_Screen.tsx";
//import  from "./settings_Screen.tsx";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

const SettingsScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.screenText}>Ajustes</Text>
    </View>
);

const Tab = createBottomTabNavigator();

export default function VaccinationAgentMenu() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    // Diccionario de iconos
                    const icons: Record<string, string> = {
                        Comercio: "cart-outline",
                        Ajustes: "settings-outline",
                    };

                    return <Icon name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.forestGreen,
                tabBarInactiveTintColor: COLORS.darkGray,
                tabBarLabelStyle: { 
                    fontSize: 12, 
                    fontWeight: "600",
                },
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.lightGreen,
                    borderTopWidth: 1,
                    height: 60, // Aumenta la altura de la barra
                    paddingBottom: 1, // Espacio interno inferior
                    paddingTop: 3, // Espacio interno superior (opcional)
                },
                tabBarIndicatorStyle: { backgroundColor: COLORS.forestGreen, height: 4 },
                tabBarShowIcon: true,
                headerStyle: {
                    backgroundColor: COLORS.cream,
                    borderBottomColor: COLORS.lightGreen,
                    borderBottomWidth: 1,
                },
                headerTitleStyle: {
                    color: COLORS.forestGreen,
                    fontWeight: "bold",
                },
            })}
        >
            <Tab.Screen name="Comercio" component={CommerceMenu} />
            <Tab.Screen name="Ajustes" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.cream,
        justifyContent: "center",
        alignItems: "center",
    },
    screenText: {
        fontSize: 24,
        color: COLORS.forestGreen,
        fontWeight: "600",
    },
});