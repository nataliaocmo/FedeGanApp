import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

interface ImportedAnimal {
    id: string;
    species: string;
    farmId: string;
    quantity: number;
    importedAt: any; // Timestamp
    origin: string;
}

interface ExportedAnimal {
    id: string;
    species: string;
    farmId: string;
    quantity: number;
    exportedAt: string; // ISO string
    destination: string;
}

interface Farm {
    id: string;
    name: string;
}

interface Movement {
    id: string;
    type: "import" | "export";
    species: string;
    farmId: string;
    farmName: string;
    quantity: number;
    originOrDestination: string;
    date: string; // Formatted date
    timestamp: number; // For sorting
}

export default function GeneralCommerce() {
    const { user } = useAuth();
    const router = useRouter();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const farmsRef = useRef<Map<string, string>>(new Map());
    const importedMovementsRef = useRef<Movement[]>([]);
    const exportedMovementsRef = useRef<Movement[]>([]);

    const formatDate = (input: any): { formatted: string; timestamp: number } => {
        let date: Date;
        if (typeof input === "string") {
            date = new Date(input);
        } else if (input && input.toDate) {
            date = input.toDate();
        } else {
            date = new Date();
        }
        const formatted = date.toLocaleString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return { formatted, timestamp: date.getTime() };
    };

    const updateMovements = () => {
        const allMovements = [...importedMovementsRef.current, ...exportedMovementsRef.current].sort(
            (a, b) => b.timestamp - a.timestamp
        );
        setMovements(allMovements);
        console.log("Movimientos actualizados:", allMovements);
    };

    useEffect(() => {
        if (!user) {
            console.error("Usuario no autenticado");
            Alert.alert("Error", "Debes iniciar sesión para ver esta página.", [
                { text: "OK", onPress: () => router.replace("/auth/Login") },
            ]);
            return;
        }

        if (user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no permitido", { role: user.role });
            Alert.alert("Error", "No tienes permiso para ver esta página.", [
                { text: "OK", onPress: () => router.push("/farmManagerMenu") },
            ]);
            return;
        }

        // Load farms
        const farmsQuery = collection(db, "farms");
        const unsubscribeFarms = onSnapshot(farmsQuery, (snapshot) => {
            const farmMap = new Map<string, string>();
            snapshot.docs.forEach((doc) => {
                const data = doc.data() as Farm;
                farmMap.set(doc.id, data.name || "Finca sin nombre");
            });
            farmsRef.current = farmMap;
            console.log("Fincas cargadas:", Array.from(farmMap.entries()));
            // Update movements with new farm names
            importedMovementsRef.current = importedMovementsRef.current.map((m) => ({
                ...m,
                farmName: farmMap.get(m.farmId) || "Cargando finca...",
            }));
            exportedMovementsRef.current = exportedMovementsRef.current.map((m) => ({
                ...m,
                farmName: farmMap.get(m.farmId) || "Cargando finca...",
            }));
            updateMovements();
        }, (error) => {
            console.error("Error al cargar fincas:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar las fincas: ${error.message}`);
        });

        // Load imported animals
        const importedQuery = collection(db, "importedAnimals");
        const unsubscribeImported = onSnapshot(importedQuery, (snapshot) => {
            importedMovementsRef.current = snapshot.docs.map((doc) => {
                const data = doc.data() as ImportedAnimal;
                const { formatted, timestamp } = formatDate(data.importedAt);
                return {
                    id: doc.id,
                    type: "import",
                    species: data.species,
                    farmId: data.farmId,
                    farmName: farmsRef.current.get(data.farmId) || "Cargando finca...",
                    quantity: data.quantity,
                    originOrDestination: data.origin || "Desconocido",
                    date: formatted,
                    timestamp,
                };
            });
            console.log("Movimientos importados:", importedMovementsRef.current);
            updateMovements();
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar animales importados:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar los animales importados: ${error.message}`);
            setLoading(false);
        });

        // Load exported animals
        const exportedQuery = collection(db, "exportedAnimals");
        const unsubscribeExported = onSnapshot(exportedQuery, (snapshot) => {
            exportedMovementsRef.current = snapshot.docs.map((doc) => {
                const data = doc.data() as ExportedAnimal;
                const { formatted, timestamp } = formatDate(data.exportedAt);
                return {
                    id: doc.id,
                    type: "export",
                    species: data.species,
                    farmId: data.farmId,
                    farmName: farmsRef.current.get(data.farmId) || "Cargando finca...",
                    quantity: data.quantity,
                    originOrDestination: data.destination || "Desconocido",
                    date: formatted,
                    timestamp,
                };
            });
            console.log("Movimientos exportados:", exportedMovementsRef.current);
            updateMovements();
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar animales exportados:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar los animales exportados: ${error.message}`);
            setLoading(false);
        });

        return () => {
            unsubscribeFarms();
            unsubscribeImported();
            unsubscribeExported();
        };
    }, [user, router]);

    const renderMovement = ({ item }: { item: Movement }) => (
        <View style={styles.movementItem}>
            <View style={styles.detailRow}>
                <Icon
                    name={item.type === "import" ? "import" : "export"}
                    size={20}
                    color={COLORS.forestGreen}
                    style={styles.detailIcon}
                />
                <View>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>Tipo: </Text>
                        {item.type === "import" ? "Importación" : "Exportación"}
                    </Text>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>Especie: </Text>
                        {item.species}
                    </Text>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>Finca: </Text>
                        {item.farmName}
                    </Text>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>Cantidad: </Text>
                        {item.quantity}
                    </Text>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>
                            {item.type === "import" ? "Origen: " : "Destino: "}
                        </Text>
                        {item.originOrDestination}
                    </Text>
                    <Text style={styles.movementText}>
                        <Text style={{ fontWeight: "bold" }}>Fecha: </Text>
                        {item.date}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Icon name="loading" size={40} color={COLORS.forestGreen} style={styles.loadingIcon} />
                <Text style={styles.loadingText}>Cargando...</Text>
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
                <Icon name="chart-line" size={24} color={COLORS.white} />
                <Text style={styles.title}>Resumen</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Movimientos de Animales</Text>
                <FlatList
                    data={movements}
                    renderItem={renderMovement}
                    keyExtractor={(item) => `${item.id}-${item.type}`}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="file-document-outline" size={40} color={COLORS.softBrown} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No hay movimientos registrados.</Text>
                        </View>
                    }
                />
                
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
        marginLeft: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.white,
        letterSpacing: 0.5,
        textAlign: "center",
        marginLeft: 8,
    },
    formContainer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flex: 1,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 12,
        textAlign: "center",
    },
    movementItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGreen,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailIcon: {
        marginRight: 8,
    },
    movementText: {
        fontSize: 12,
        color: COLORS.darkGray,
        marginLeft: 8,
        marginBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.cream,
    },
    loadingIcon: {
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 16,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
    },
    backText: {
        marginTop: 20,
        color: COLORS.softBrown,
        fontSize: 14,
        textDecorationLine: "underline",
        textAlign: "center",
    },
});