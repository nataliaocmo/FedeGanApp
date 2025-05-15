import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
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

export default function FarmsRegister() {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [owner, setOwner] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    const handleRegisterFarm = async () => {
        if (!name || !address || !owner) {
            showAlert("Error", "Por favor completa todos los campos.", () => {});
            return;
        }

        if (!user) {
            showAlert("Error", "Debes estar autenticado para registrar una finca.", () => {});
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "farms"), {
                name,
                address,
                owner,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });

            // Verify the document exists
            const createdDoc = await getDoc(doc(db, "farms", docRef.id));
            if (createdDoc.exists()) {
                console.log("Documento creado en Firestore:", createdDoc.data());
            } else {
                console.error("Documento no encontrado después de crearlo, ID:", docRef.id);
            }

            console.log("Finca registrada, ID:", docRef.id);
            showAlert("Éxito", "Finca registrada correctamente.", () => {
                const url = `/farmsAndAnimal/farmDetails/${docRef.id}`;
                console.log("URL completa:", url);
                router.push({
                    pathname: "/vaccinationAgentMenu/farmsAndAnimals/farmDetails/[farmId]",
                    params: { farmId: docRef.id },
                });
            });
        } catch (error: any) {
            console.error("Error al registrar finca:", error.message, error.code);
            showAlert("Error", "No se pudo registrar la finca.", () => {});
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Registrar Finca</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.subtitle}>Llena el formulario:</Text>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="barn" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Nombre de la finca</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Finca La Esperanza"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="map-marker-outline" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Dirección</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Vereda El Carmen, Montería"
                        value={address}
                        onChangeText={setAddress}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                        <Icon name="account-outline" size={20} color={COLORS.forestGreen} style={styles.inputIcon} />
                        <Text style={styles.label}>Propietario</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Juan Pérez"
                        value={owner}
                        onChangeText={setOwner}
                        placeholderTextColor={COLORS.softBrown}
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegisterFarm}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>Registrar Finca</Text>
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
        paddingTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
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
    formContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "500",
        color: COLORS.forestGreen,
        marginBottom: 20,
        justifyContent: "center",
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
        fontWeight: "600",
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