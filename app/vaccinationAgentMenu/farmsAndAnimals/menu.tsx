import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Ensure this is installed

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
            <View style={styles.header}>
                <Icon name="barn" size={40} color={COLORS.forestGreen} />
                <Text style={styles.title}>Menú Principal</Text>
                <Text style={styles.subtitle}>Elige una opción:</Text>
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/vaccinationAgentMenu/farmsAndAnimals/farmsRegister")}
                activeOpacity={0.7}
            >
                <Icon name="plus-circle-outline" size={24} color={COLORS.white} style={styles.icon} />
                <Text style={styles.buttonText}>Registrar finca</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/vaccinationAgentMenu/farmsAndAnimals/farmsView")}
                activeOpacity={0.7}
            >
                <Icon name="view-list-outline" size={24} color={COLORS.white} style={styles.icon} />
                <Text style={styles.buttonText}>Fincas y animales</Text>
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
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.forestGreen,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "400",
        color: COLORS.forestGreen,
        letterSpacing: 0.5,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 16,
        width: "90%",
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
        textAlign: "left",
    },
    icon: {
        marginRight: 12,
    },
});