import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

export default function FarmsRegister() {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [owner, setOwner] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    const handleRegisterFarm = async () => {
        if (!name || !address || !owner) {
            Alert.alert("Error", "Por favor completa todos los campos.");
            return;
        }

        if (!user) {
            Alert.alert("Error", "Debes estar autenticado para registrar una finca.");
            return;
        }

        try {
            await addDoc(collection(db, "farms"), {
                name,
                address,
                owner,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });

            Alert.alert("Éxito", "Finca registrada correctamente.");
            router.back(); // Vuelve al menú
        } catch (error) {
            console.error("Error al registrar finca:", error);
            Alert.alert("Error", "No se pudo registrar la finca.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrar Nueva Finca</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre de la finca</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Finca La Esperanza"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={COLORS.softBrown}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Vereda El Carmen, Montería"
                    value={address}
                    onChangeText={setAddress}
                    placeholderTextColor={COLORS.softBrown}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Propietario</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Juan Pérez"
                    value={owner}
                    onChangeText={setOwner}
                    placeholderTextColor={COLORS.softBrown}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegisterFarm}>
                <Text style={styles.buttonText}>Registrar Finca</Text>
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
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: COLORS.forestGreen,
        marginBottom: 30,
    },
    inputContainer: {
        width: "85%",
        marginBottom: 16,
    },
    label: {
        marginBottom: 4,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    input: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGreen,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.darkGray,
    },
    button: {
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 24,
        width: "85%",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: "center",
        fontWeight: "600",
    },
    backText: {
        marginTop: 20,
        color: COLORS.softBrown,
        fontSize: 14,
        textDecorationLine: "underline",
    },
});