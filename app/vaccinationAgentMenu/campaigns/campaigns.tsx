import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

// Función para mostrar alertas
const showAlert = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: "Cancelar", style: "cancel" },
            { text: "OK", onPress: onConfirm },
        ]);
    }
};

export default function CampaignForm() {
    const { user } = useAuth();
    const { outbreakId, farmId } = useLocalSearchParams();
    const [vaccineType, setVaccineType] = useState("");
    const [targetAnimals, setTargetAnimals] = useState("");
    const [startDate, setStartDate] = useState("");
    const router = useRouter();

    const handleSubmitCampaign = async () => {
        if (!user || user.role !== "vaccinationAgent") {
            console.error("Acceso denegado: Rol no es vaccinationAgent");
            showAlert("Error", "No tienes permiso para crear campañas.", () => {});
            return;
        }

        if (!outbreakId || !farmId || !vaccineType.trim() || !targetAnimals.trim() || !startDate.trim()) {
            console.error("Datos incompletos:", { outbreakId, farmId, vaccineType, targetAnimals, startDate });
            showAlert("Error", "Por favor, completa todos los campos.", () => {});
            return;
        }

        const animalsCount = parseInt(targetAnimals, 10);
        if (isNaN(animalsCount) || animalsCount <= 0) {
            showAlert("Error", "El número de animales debe ser un número válido mayor a 0.", () => {});
            return;
        }

        // Validar formato de fecha (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate)) {
            showAlert("Error", "La fecha debe estar en formato AAAA-MM-DD.", () => {});
            return;
        }

        try {
            console.log("Creando campaña para outbreakId:", outbreakId);
            await addDoc(collection(db, "campaigns"), {
                outbreakId,
                farmId,
                vaccineType,
                targetAnimals: animalsCount,
                startDate,
                createdAt: new Date(),
                createdBy: user.uid,
            });
            console.log("Campaña creada correctamente.");
            showAlert("Éxito", "Campaña creada correctamente.", () => {
                router.back();
            });
        } catch (error: any) {
            console.error("Error al crear campaña:", error.message);
            showAlert("Error", "No se pudo crear la campaña.", () => {});
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.forestGreen} />
                </TouchableOpacity>
                <Text style={styles.title}>Crear Campaña de Vacunación</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Tipo de Vacuna</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Fiebre aftosa"
                    placeholderTextColor={COLORS.darkGray}
                    value={vaccineType}
                    onChangeText={setVaccineType}
                />

                <Text style={styles.label}>Número de Animales</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. 50"
                    placeholderTextColor={COLORS.darkGray}
                    value={targetAnimals}
                    onChangeText={setTargetAnimals}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Fecha de Inicio (AAAA-MM-DD)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. 2025-05-15"
                    placeholderTextColor={COLORS.darkGray}
                    value={startDate}
                    onChangeText={setStartDate}
                />

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitCampaign}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>Crear Campaña</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        position: "relative",
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.forestGreen,
        letterSpacing: 0.5,
    },
    form: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.cream,
        borderColor: COLORS.darkGray,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "500",
    },
});