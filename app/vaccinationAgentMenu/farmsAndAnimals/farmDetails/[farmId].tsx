import { db } from "@/utils/FirebaseConfig";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
    yellow: "#FFB300", // Nuevo color amarillo
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
        Alert.alert(title, message, [
            { text: "Cancelar", style: "cancel" },
            { text: "OK", onPress: onConfirm },
        ]);
    }
};

export default function FarmDetails() {
    const { farmId } = useLocalSearchParams();
    const [farm, setFarm] = useState<Farm | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [isOutbreakRegistered, setIsOutbreakRegistered] = useState(false); // Nuevo estado
    const router = useRouter();

    // Contar animales enfermos
    const sickAnimalsCount = animals.filter((animal) => animal.status === "Enfermo").length;
    const showOutbreakButton = sickAnimalsCount >= 2;

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

        const checkOutbreak = async () => {
            if (typeof farmId !== "string" || !farmId) return;
            try {
                console.log("Verificando brote existente para farmId:", farmId);
                const q = query(collection(db, "outbreaks"), where("farmId", "==", farmId));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const hasOutbreak = !snapshot.empty;
                    console.log("Brote existente:", hasOutbreak);
                    setIsOutbreakRegistered(hasOutbreak);
                }, (error) => {
                    console.error("Error al verificar brote:", error.message, error.code);
                });
                return () => unsubscribe();
            } catch (error: any) {
                console.error("Error al configurar listener de brote:", error.message);
            }
        };

        fetchFarm();
        checkOutbreak();

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

    const handleNavigateToAnimalDetails = (animalId: string) => {
        if (typeof farmId !== "string" || !farmId) {
            console.error("ID de finca inválido para navegación:", farmId);
            showAlert("Error", "ID de finca inválido.", () => {});
            return;
        }

        console.log("Navegando a animalDetails, animalId:", animalId);
        router.push({
            pathname: "/vaccinationAgentMenu/farmsAndAnimals/animalDetails/[animalId]",
            params: { animalId, farmId },
        });
    };

    const handleDeleteAnimal = (animalId: string, animalName: string | undefined) => {
        showAlert(
            "Confirmar Eliminación",
            `¿Estás seguro de que deseas eliminar ${animalName || "este animal"}? Esta acción no se puede deshacer.`,
            async () => {
                try {
                    console.log("Eliminando animal, ID:", animalId);
                    await deleteDoc(doc(db, "animals", animalId));
                    console.log("Animal eliminado, ID:", animalId);
                    showAlert("Éxito", "Animal eliminado correctamente.", () => {});
                } catch (error: any) {
                    console.error("Error al eliminar animal:", error.message, error.code);
                    showAlert("Error", "No se pudo eliminar el animal.", () => {});
                }
            }
        );
    };

    const handleRegisterOutbreak = async () => {
        console.log("Entraste al brote");
        if (typeof farmId !== "string" || !farmId) {
            console.error("ID de finca inválido:", farmId);
            showAlert("Error", "ID de finca inválido.", () => {});
            return;
        }

        // Definir tipo para location
        let location: Location.LocationObject;

        // Obtener permisos de ubicación (móvil)
        if (Platform.OS !== "web") {
            console.log("Entraste al if (móvil)");
            const { status } = await Location.requestForegroundPermissionsAsync();
            console.log("Estado de permisos:", status);
            if (status !== "granted") {
                showAlert("Error", "Permiso de ubicación denegado.", () => {});
                return;
            }

            try {
                location = await Location.getCurrentPositionAsync({});
                console.log("Ubicación obtenida (móvil):", location.coords);
            } catch (error: any) {
                console.error("Error al obtener ubicación (móvil):", error.message);
                showAlert("Error", "No se pudo obtener la ubicación.", () => {});
                return;
            }
        } else {
            console.log("Entraste al else (web)");
            // Geolocalización en web
            try {
                console.log("Entraste al try (web)");
                location = await new Promise<Location.LocationObject>((resolve, reject) => {
                    if (!navigator.geolocation) {
                        console.log("Geolocalización no soportada por el navegador");
                        reject(new Error("Geolocalización no soportada por el navegador."));
                        return;
                    }
                    console.log("Solicitando geolocalización en navegador");
                    const timeoutId = setTimeout(() => {
                        console.log("Timeout de geolocalización alcanzado");
                        reject(new Error("Tiempo de espera agotado para obtener la ubicación."));
                    }, 10000); // 10 segundos de timeout

                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            console.log("Geolocalización exitosa, posición:", position.coords);
                            clearTimeout(timeoutId);
                            resolve({
                                coords: {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    altitude: null,
                                    accuracy: position.coords.accuracy,
                                    altitudeAccuracy: null,
                                    heading: null,
                                    speed: null,
                                },
                                timestamp: position.timestamp,
                            });
                        },
                        (error) => {
                            console.log("Error en geolocalización:", error.message, error.code);
                            clearTimeout(timeoutId);
                            reject(error);
                        },
                        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
                    );
                    console.log("Solicitud de geolocalización enviada");
                });
                console.log("Ubicación obtenida (web):", location.coords);
            } catch (error: any) {
                console.error("Error al obtener ubicación en web:", error.message);
                showAlert("Error", `No se pudo obtener la ubicación en el navegador: ${error.message}`, () => {});
                return;
            }
        }

        console.log("Saliste del try");
        const { latitude, longitude } = location.coords;

        // Obtener enfermedades únicas de animales enfermos
        const diseases = Array.from(
            new Set(animals.filter((a) => a.status === "Enfermo" && a.disease).map((a) => a.disease))
        );

        try {
            console.log("Registrando brote, farmId:", farmId, "Coordenadas:", { latitude, longitude });
            await addDoc(collection(db, "outbreaks"), {
                farmId,
                latitude,
                longitude,
                diseases,
                sickAnimalsCount,
                createdAt: new Date(),
                createdBy: "vaccinationAgent", // Reemplazar con user.uid si usas autenticación
            });
            console.log("Brote registrado correctamente.");
            setIsOutbreakRegistered(true); // Actualizar estado
            showAlert("Éxito", "Brote registrado correctamente.", () => {});
        } catch (error: any) {
            console.error("Error al registrar brote:", error.message, error.code);
            showAlert("Error", "No se pudo registrar el brote.", () => {});
        }
    };

    if (!farm) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.replace("/vaccinationAgentMenu/farmsAndAnimals/farmsView")}
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
                    onPress={() => router.replace("/vaccinationAgentMenu/farmsAndAnimals/farmsView")}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
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
                                <TouchableOpacity
                                    style={styles.animalContent}
                                    onPress={() => handleNavigateToAnimalDetails(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.animalHeader}>
                                        <Icon name="paw" size={20} color={COLORS.forestGreen} style={styles.animalIcon} />
                                        <Text style={styles.animalName}>{item.name || item.species}</Text>
                                    </View>
                                    <Text style={styles.animalDetail}>Raza: {item.breed}</Text>
                                    <Text style={styles.animalDetail}>Cantidad: {item.quantity}</Text>
                                    <View style={styles.statusContainer}>
                                        <Icon
                                            name={item.status === "Sano" ? "heart" : "hospital-box"}
                                            size={16}
                                            color={item.status === "Sano" ? COLORS.forestGreen : COLORS.softBrown}
                                            style={styles.statusIcon}
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: item.status === "Sano" ? COLORS.forestGreen : COLORS.softBrown },
                                            ]}
                                        >
                                            Estado: {item.status}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteAnimal(item.id, item.name || item.species)}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="trash-can-outline" size={20} color={COLORS.softBrown} />
                                </TouchableOpacity>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
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

            {showOutbreakButton && (
                <TouchableOpacity
                    style={[styles.button, isOutbreakRegistered ? styles.registeredButton : styles.outbreakButton]}
                    onPress={isOutbreakRegistered ? () => {} : handleRegisterOutbreak}
                    activeOpacity={0.7}
                >
                    <Icon
                        name={isOutbreakRegistered ? "check-circle-outline" : "virus-outline"}
                        size={20}
                        color={COLORS.white}
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>
                        {isOutbreakRegistered ? "Brote registrado" : "Registrar brote"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
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
        flex: 1,
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
        flexDirection: "row",
        alignItems: "center",
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
    animalContent: {
        flex: 1,
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
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusIcon: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
    },
    deleteButton: {
        padding: 8,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderColor: COLORS.softBrown,
        borderWidth: 1,
        marginLeft: 8,
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
        justifyContent: "center",
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
        marginBottom: 12,
        textAlign: "center",
    },
    outbreakButton: {
        backgroundColor: COLORS.softBrown,
        textAlign: "center",
    },
    registeredButton: {
        backgroundColor: COLORS.yellow,
        textAlign: "center",
    },
    buttonIcon: {
        marginRight: 8,
        textAlign: "center",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
        textAlign: "center",
    },
});