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

export default function CommerceMenu() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon name="import" size={40} color={COLORS.forestGreen} />
                <Text style={styles.title}>Importación</Text>
                <Text style={styles.subtitle}>Elige una opción:</Text>
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/farmManagerMenu/commerce/import/importForm")}
                activeOpacity={0.7}
            >
                <Icon name="tray-arrow-down" size={24} color={COLORS.white} style={styles.icon} />
                <Text style={styles.buttonText}>Hacer importación</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/farmManagerMenu/commerce/import/import")}
                activeOpacity={0.7}
            >
                <Icon name="download-box" size={24} color={COLORS.white} style={styles.icon} />
                <Text style={styles.buttonText}>Ver importaciones</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backText}>Volver</Text>
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
    backText: {
        marginTop: 15,
        color: COLORS.softBrown,
        fontSize: 14,
        textDecorationLine: "underline",
    },
});