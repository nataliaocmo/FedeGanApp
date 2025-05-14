import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

export default function AnimalRegister() {
    const { farmId } = useLocalSearchParams(); // Obtener farmId de los parámetros
    //const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [medicalHistory, setMedicalHistory] = useState("");
    const [quantity, setQuantity] = useState(1); // Nuevo campo para cantidad
    const router = useRouter();
    const { user } = useAuth();

    const handleRegisterAnimal = async () => {
        if (!species || !breed || !age || !medicalHistory || !quantity) {
            Alert.alert("Error", "Por favor completa todos los campos.");
            return;
        }

        if (!user) {
            Alert.alert("Error", "Debes estar autenticado para registrar un animal.");
            return;
        }

        if (typeof farmId !== "string") {
            Alert.alert("Error", "ID de finca inválido.");
            return;
        }

        try {
            await addDoc(collection(db, "animals"), {
                //name,
                species,
                breed,
                age: Number(age),
                medicalHistory,
                quantity, 
                farmId,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });

            Alert.alert("Éxito", "Animal registrado correctamente.");
            router.back(); // Vuelve a farmDetails
        } catch (error) {
            console.error("Error al registrar animal:", error);
            Alert.alert("Error", "No se pudo registrar el animal.");
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
                <Text style={styles.title}>Registro de Animales</Text>
            </View>
            <View style={styles.formContainer}>
                {/* <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="paw" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Nombre</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Luna"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View> */}

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
                        <Text style={styles.label}>Edad (años)</Text>
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
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
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
});