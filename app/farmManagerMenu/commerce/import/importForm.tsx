import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

const showAlert = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [{ text: "OK", onPress: onConfirm }]);
    }
};

export default function ImportForm() {
    const [species, setSpecies] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [medicalHistory, setMedicalHistory] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState<"Sano" | "Enfermo" | "">("");
    const [disease, setDisease] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    const handleImportAnimal = async () => {
        if (!species || !breed || !age || !medicalHistory || !quantity || !status) {
            showAlert("Error", "Por favor completa todos los campos obligatorios.", () => {});
            return;
        }

        if (status === "Enfermo" && !disease.trim()) {
            showAlert("Error", "Por favor especifica la enfermedad.", () => {});
            return;
        }

        if (!user) {
            showAlert("Error", "Debes estar autenticado para importar un animal.", () => {
                router.replace("/auth/Login");
            });
            return;
        }

        if (!user.farmId || typeof user.farmId !== "string") {
            showAlert("Error", "No tienes una finca asignada. Contacta al administrador.", () => {
                router.push("/farmManagerMenu");
            });
            return;
        }

        try {
            const batch = writeBatch(db);
            const animalId = doc(collection(db, "animals")).id;
            const animalRef = doc(db, "animals", animalId);
            const importedAnimalRef = doc(db, "importedAnimals", animalId);

            const animalData = {
                species,
                breed,
                age: Number(age),
                medicalHistory,
                status,
                disease: status === "Enfermo" ? disease : null,
                quantity,
                farmId: user.farmId,
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
                isImported: true,
            };

            const importedAnimalData = {
                species,
                breed,
                age: Number(age),
                medicalHistory,
                status,
                disease: status === "Enfermo" ? disease : null,
                quantity,
                farmId: user.farmId,
                importedAt: serverTimestamp(),
            };

            batch.set(animalRef, animalData);
            batch.set(importedAnimalRef, importedAnimalData);

            await batch.commit();
            console.log("Animal importado:", { animalId, farmId: user.farmId, species, quantity });

            showAlert("Éxito", "Animal importado correctamente.", () => {
                router.push("/farmManagerMenu/commerce/import/import");
            });
        } catch (error: any) {
            console.error("Error al importar animal:", error.message, { code: error.code });
            showAlert("Error", `No se pudo importar el animal: ${error.message}`, () => {});
        }
    };

    const handleIncreaseQuantity = () => {
        setQuantity((prev) => prev + 1);
    };

    const handleDecreaseQuantity = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Importar Animal</Text>
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
                    onPress={handleImportAnimal}
                    activeOpacity={0.7}
                >
                    <Icon name="import" size={20} color={COLORS.white} style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Importar nuevo animal</Text>
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
    buttonIcon: {
        marginRight: 8,
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