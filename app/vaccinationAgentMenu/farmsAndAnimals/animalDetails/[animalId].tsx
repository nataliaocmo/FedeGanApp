import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

interface Animal {
    id: string;
    name?: string;
    species: string;
    breed: string;
    age: number;
    medicalHistory: string;
    status: "Sano" | "Enfermo";
    disease: string | null;
    quantity: number;
    farmId: string;
    createdAt: any;
    createdBy: string;
}

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

export default function AnimalDetails() {
    const { animalId, farmId } = useLocalSearchParams();
    const [animal, setAnimal] = useState<Animal | null>(null);
    const router = useRouter();

    useEffect(() => {
        console.log("Parámetros recibidos, animalId:", animalId, "farmId:", farmId);

        const fetchAnimal = async () => {
            if (typeof animalId !== "string" || !animalId) {
                console.error("ID de animal inválido:", animalId);
                showAlert("Error", "ID de animal inválido.", () => router.back());
                return;
            }

            try {
                console.log("Cargando animal con ID:", animalId);
                const animalDoc = await getDoc(doc(db, "animals", animalId));
                if (animalDoc.exists()) {
                    const animalData = { id: animalDoc.id, ...animalDoc.data() } as Animal;
                    console.log("Animal cargado:", animalData);
                    setAnimal(animalData);
                } else {
                    console.error("El animal no existe, ID:", animalId);
                    showAlert("Error", "El animal no existe.", () => router.back());
                }
            } catch (error: any) {
                console.error("Error al obtener animal:", error.message, error.code);
                showAlert("Error", "No se pudo cargar el animal.", () => router.back());
            }
        };

        fetchAnimal();
    }, [animalId]);

    if (!animal) {
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
                    <Text style={styles.title}>Cargando...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Características</Text>
            </View>
            <View style={styles.animalCard}>
                <View style={styles.animalHeader}>
                    <Icon name="paw" size={24} color={COLORS.forestGreen} style={styles.animalIcon} />
                    <Text style={styles.animalName}>{animal.name || animal.species}</Text>
                </View>
                <Text style={styles.animalDetail}>Especie: {animal.species}</Text>
                <Text style={styles.animalDetail}>Raza: {animal.breed}</Text>
                <Text style={styles.animalDetail}>Edad: {animal.age} años</Text>
                <Text style={styles.animalDetail}>Historial Médico: {animal.medicalHistory}</Text>
                <View style={styles.statusContainer}>
                    <Icon
                        name={animal.status === "Sano" ? "heart" : "hospital-box"}
                        size={16}
                        color={animal.status === "Sano" ? COLORS.forestGreen : COLORS.softBrown}
                        style={styles.statusIcon}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: animal.status === "Sano" ? COLORS.forestGreen : COLORS.softBrown },
                        ]}
                    >
                        Estado: {animal.status}
                    </Text>
                </View>
                {animal.status === "Enfermo" && animal.disease && (
                    <Text style={styles.animalDetail}>Enfermedad: {animal.disease}</Text>
                )}
                <Text style={styles.animalDetail}>Cantidad: {animal.quantity}</Text>
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
        backgroundColor: COLORS.forestGreen,
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 8,
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
        marginLeft: 10
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    animalCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        width: "100%",
        marginBottom: 20,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    animalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    animalIcon: {
        marginRight: 8,
    },
    animalName: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    animalDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    statusIcon: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
    },
});