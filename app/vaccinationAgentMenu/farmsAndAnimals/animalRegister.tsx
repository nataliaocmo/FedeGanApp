import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

// Función para mostrar alertas compatible con web y móvil
const showAlert = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [{ text: "OK", onPress: onConfirm }]);
    }
};

export default function AnimalRegister() {
    const { farmId } = useLocalSearchParams(); // Obtener farmId de los parámetros
    const [species, setSpecies] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [medicalHistory, setMedicalHistory] = useState("");
    const [quantity, setQuantity] = useState(1); // Campo para cantidad
    const [status, setStatus] = useState<"Sano" | "Enfermo" | "">(""); // Estado para Sano/Enfermo
    const [disease, setDisease] = useState(""); // Campo para enfermedad
    const router = useRouter();
    const { user } = useAuth();

    const handleRegisterAnimal = async () => {
        if (!species || !breed || !age || !medicalHistory || !quantity || !status) {
            showAlert("Error", "Por favor completa todos los campos obligatorios.", () => {});
            return;
        }

        if (status === "Enfermo" && !disease.trim()) {
            showAlert("Error", "Por favor especifica la enfermedad.", () => {});
            return;
        }

        if (!user) {
            showAlert("Error", "Debes estar autenticado para registrar un animal.", () => {});
            return;
        }

        if (typeof farmId !== "string") {
            showAlert("Error", "ID de finca inválido.", () => router.back());
            return;
        }

        try {
            await addDoc(collection(db, "animals"), {
                species,
                breed,
                age: Number(age),
                medicalHistory,
                status,
                disease: status === "Enfermo" ? disease : null, // Guardar enfermedad solo si está enfermo
                quantity,
                farmId,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });

            showAlert("Éxito", "Animal registrado correctamente.", () => {
                router.push({
                    pathname: "/vaccinationAgentMenu/farmsAndAnimals/farmDetails/[farmId]",
                    params: { farmId },
                });
            });
        } catch (error) {
            console.error("Error al registrar animal:", error);
            showAlert("Error", "No se pudo registrar el animal.", () => {});
        }
    };

    const handleIncreaseQuantity = () => {
        setQuantity((prev) => prev + 1);
    };

    const handleDecreaseQuantity = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1)); // No permitir menos de 1
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Registro de animales</Text>
            </View>
            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="cow" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Especie</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Bovino"
                        value={species}
                        onChangeText={setSpecies}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="tag-outline" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Raza</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Holstein"
                        value={breed}
                        onChangeText={setBreed}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="calendar" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Edad promedio (años)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 3"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="medical-bag" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Historial Médico</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Vacunas al día, desparasitado"
                        value={medicalHistory}
                        onChangeText={setMedicalHistory}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="heart-pulse" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Estado de Salud</Text>
                    </View>
                    <View style={styles.statusContainer}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                status === "Sano" && styles.statusButtonSelected,
                            ]}
                            onPress={() => setStatus("Sano")}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    status === "Sano" && styles.statusButtonTextSelected,
                                ]}
                            >
                                Sano
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                status === "Enfermo" && styles.statusButtonSelected,
                            ]}
                            onPress={() => setStatus("Enfermo")}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    status === "Enfermo" && styles.statusButtonTextSelected,
                                ]}
                            >
                                Enfermo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {status === "Enfermo" && (
                    <View style={styles.inputContainer}>
                        <View style={styles.inputHeader}>
                            <Icon name="hospital-box" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                            <Text style={styles.label}>Enfermedad</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Fiebre aftosa"
                            value={disease}
                            onChangeText={setDisease}
                            placeholderTextColor={COLORS.softBrown}
                            multiline
                            numberOfLines={2}
                        />
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="counter" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Cantidad</Text>
                    </View>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={handleDecreaseQuantity}
                            activeOpacity={0.7}
                        >
                            <Icon name="minus" size={20} color={COLORS.forestGreen} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={handleIncreaseQuantity}
                            activeOpacity={0.7}
                        >
                            <Icon name="plus" size={20} color={COLORS.forestGreen} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegisterAnimal}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>Registrar Animal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Volver</Text>
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
        alignItems: "center",
        justifyContent: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        position: "relative",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.forestGreen,
        letterSpacing: 0.5,
    },
    formContainer: {
        width: "100%",
        alignItems: "center",
    },
    inputContainer: {
        width: "100%",
        marginBottom: 16,
    },
    inputHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    inputIcon: {
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    input: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGreen,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.darkGray,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statusButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGreen,
        borderWidth: 1,
        borderRadius: 12,
        alignItems: "center",
    },
    statusButtonSelected: {
        backgroundColor: COLORS.lightGreen,
        borderColor: COLORS.forestGreen,
    },
    statusButtonText: {
        fontSize: 16,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    statusButtonTextSelected: {
        color: COLORS.forestGreen,
        fontWeight: "600",
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGreen,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 3,
    },
    quantityButton: {
        padding: 8,
    },
    quantityText: {
        fontSize: 16,
        color: COLORS.darkGray,
        fontWeight: "600",
        marginHorizontal: 20,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: "100%",
        marginTop: 24,
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
        textAlign: "center",
    },
    backText: {
        marginTop: 20,
        color: COLORS.softBrown,
        fontSize: 14,
        textDecorationLine: "underline",
    },
});