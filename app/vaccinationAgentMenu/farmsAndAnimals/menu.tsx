import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

export default function FarmsAndAnimalsMenu() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión de Fincas</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/vaccinationAgentMenu/farmsAndAnimals/farmsRegister")}
            >
                <Text style={styles.buttonText}>Registrar nueva finca</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/vaccinationAgentMenu/farmsAndAnimals/farmsView")}
            >
                <Text style={styles.buttonText}>Ver fincas</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: COLORS.forestGreen,
        marginBottom: 40,
    },
    button: {
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginBottom: 20,
        width: "85%",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: "center",
        fontWeight: "600",
    },
});