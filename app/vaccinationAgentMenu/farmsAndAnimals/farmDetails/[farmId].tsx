import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

interface Farm {
    id: string;
    name: string;
    address: string;
    owner: string;
    createdAt: any; // Timestamp de Firebase
    createdBy: string;
}

interface Animal {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    medicalHistory: string;
    ownerInfo: string;
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

export default function FarmDetails() {
    const { farmId } = useLocalSearchParams();
    const [farm, setFarm] = useState<Farm | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const router = useRouter();

    useEffect(() => {
        console.log("Parámetros recibidos, farmId:", farmId);

        const fetchFarm = async () => {
            if (typeof farmId !== "string" || !farmId) {
                console.error("ID de finca inválido:", farmId);
                showAlert("Error", "ID de finca inválido.", () => router.back());
                return;
            }

            try {
                console.log("Cargando finca con ID:", farmId);
                const farmDoc = await getDoc(doc(db, "farms", farmId));
                if (farmDoc.exists()) {
                    const farmData = { id: farmDoc.id, ...farmDoc.data() } as Farm;
                    console.log("Finca cargada:", farmData);
                    setFarm(farmData);
                } else {
                    console.error("La finca no existe, ID:", farmId);
                    showAlert("Error", "La finca no existe.", () => router.back());
                }
            } catch (error: any) {
                console.error("Error al obtener finca:", error.message, error.code);
                showAlert("Error", "No se pudo cargar la finca.", () => router.back());
            }
        };

        fetchFarm();

        // Cargar animales
        if (typeof farmId === "string") {
            console.log("Configurando listener para animales, farmId:", farmId);
            const q = query(collection(db, "animals"), where("farmId", "==", farmId));
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const animalsData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Animal[];
                    console.log("Animales cargados:", animalsData);
                    setAnimals(animalsData);
                },
                (error) => {
                    console.error("Error al cargar animales:", error.message, error.code);
                }
            );
            return () => unsubscribe();
        }
    }, [farmId]);

    const handleNavigateToAnimalRegister = () => {
        if (typeof farmId !== "string" || !farmId) {
            console.error("ID de finca inválido para navegación:", farmId);
            showAlert("Error", "ID de finca inválido.", () => {});
            return;
        }

        console.log("Navegando a animalRegister, farmId:", farmId);
        router.push({
            pathname: "/vaccinationAgentMenu/farmsAndAnimals/animalRegister",
            params: { farmId },
        });
    };

    if (!farm) {
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
                    <Icon name="arrow-left" size={24} color={COLORS.forestGreen} />
                </TouchableOpacity>
                <Text style={styles.title}>Detalles</Text>
            </View>
            <View style={styles.farmCard}>
                <View style={styles.farmHeader}>
                    <Icon name="barn" size={24} color={COLORS.forestGreen} style={styles.farmIcon} />
                    <Text style={styles.farmName}>{farm.name}</Text>
                </View>
                <Text style={styles.farmDetail}>Dirección: {farm.address}</Text>
                <Text style={styles.farmDetail}>Propietario: {farm.owner}</Text>
            </View>

            <View style={styles.animalsContainer}>
                <View style={styles.subtitleContainer}>
                    <Icon name="cow" size={20} color={COLORS.forestGreen} style={styles.subtitleIcon} />
                    <Text style={styles.subtitle}>Animales Registrados</Text>
                </View>
                {animals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="alert-circle-outline" size={32} color={COLORS.softBrown} />
                        <Text style={styles.emptyText}>No hay animales registrados</Text>
                    </View>
                ) : (
                    <FlatList
                        data={animals}
                        renderItem={({ item }) => (
                            <View style={styles.animalItem}>
                                <View style={styles.animalHeader}>
                                    <Icon name="paw" size={20} color={COLORS.forestGreen} style={styles.animalIcon} />
                                    <Text style={styles.animalName}>{item.name}</Text>
                                </View>
                                <Text style={styles.animalDetail}>Especie: {item.species}</Text>
                                <Text style={styles.animalDetail}>Raza: {item.breed}</Text>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleNavigateToAnimalRegister}
                activeOpacity={0.7}
            >
                <Text style={styles.buttonText}>Registrar nuevo animal</Text>
            </TouchableOpacity>
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
    farmCard: {
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
    farmHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    farmIcon: {
        marginRight: 8,
    },
    farmName: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    farmDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 4,
    },
    animalsContainer: {
        width: "100%",
        marginBottom: 20,
    },
    subtitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    subtitleIcon: {
        marginRight: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    animalItem: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    animalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    animalIcon: {
        marginRight: 8,
    },
    animalName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    animalDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 2,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
        marginTop: 8,
        fontWeight: "500",
    },
    listContainer: {
        paddingBottom: 20,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: "100%",
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
});