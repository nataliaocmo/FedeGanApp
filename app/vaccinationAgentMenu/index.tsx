import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

// Pantallas placeholders
const FarmsAndAnimalsScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.screenText}>Fincas y animales</Text>
    </View>
);

const CampaignsScreen = () => (
    <View style={styles.screenContainer}>
        <Text style={styles.screenText}>Campañas de vacunación</Text>
    </View>
);

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
                        "Fincas y animales": "leaf-outline",
                        Campañas: "calendar-outline",
                        Ajustes: "settings-outline",
                    };

                    return <Icon name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.forestGreen,
                tabBarInactiveTintColor: COLORS.darkGray,
                tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.lightGreen,
                    borderTopWidth: 1,
                },
                tabBarIndicatorStyle: { backgroundColor: COLORS.forestGreen, height: 3 },
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
            <Tab.Screen name="Fincas y animales" component={FarmsAndAnimalsScreen} />
            <Tab.Screen name="Campañas" component={CampaignsScreen} />
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