import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const COLORS = {
    forestGreen: "#2E7D32",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

interface Animal {
    id: string;
    species: string;
    farmId: string;
    isImported: boolean;
}

export default function Import() {
    const { user } = useAuth();
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [farmName, setFarmName] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            console.error("Usuario no autenticado");
            Alert.alert("Error", "Debes iniciar sesión para ver esta página.");
            router.replace("/auth/Login");
            return;
        }

        if (user.role !== "farmManager") {
            console.error("Acceso denegado: Rol no permitido", { role: user.role });
            Alert.alert("Error", "No tienes permiso para ver esta página.");
            router.push("/farmManagerMenu");
            return;
        }

        if (!user.farmId) {
            console.error("Usuario sin finca asignada", { userId: user.uid, email: user.email });
            Alert.alert("Error", "No tienes una finca asignada. Contacta al administrador.");
            setDebugInfo("Usuario sin finca asignada.");
            setFarmName("Sin finca");
            setLoading(false);
            return;
        }

        // Fetch farm name
        const fetchFarmName = async (farmId: string) => {
            try {
                const farmDocRef = doc(db, "farms", farmId);
                const farmDoc = await getDoc(farmDocRef);
                if (farmDoc.exists()) {
                    const farmData = farmDoc.data();
                    const name = farmData.name || "Finca sin nombre";
                    setFarmName(name);
                    console.log("Nombre de la finca:", name);
                    setDebugInfo(`Finca: ${name}`);
                } else {
                    console.error("Finca no encontrada para farmId:", farmId);
                    setFarmName("Finca no encontrada");
                    setDebugInfo(`Finca no encontrada para ID: ${farmId}`);
                }
            } catch (error: any) {
                console.error("Error al cargar nombre de la finca:", error.message, { code: error.code });
                setFarmName("Error al cargar");
                setDebugInfo(`Error al cargar nombre de la finca: ${error.message}`);
            }
        };

        // Call fetchFarmName with guaranteed farmId
        fetchFarmName(user.farmId);

        console.log("Consultando animales para farmId:", user.farmId);

        // Consulta principal: animales para farmId
        const qAnimals = query(
            collection(db, "animals"),
            where("farmId", "==", user.farmId)
            // Removed isImported filter for debugging
        );

        const unsubscribeAnimals = onSnapshot(qAnimals, (snapshot) => {
            const animalsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Animal[];
            console.log("Animales obtenidos para farmId:", animalsData);
            setAnimals(animalsData);
            setDebugInfo(prev => `${prev}\nAnimales encontrados: ${animalsData.length}`);
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar animales:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar los animales: ${error.message}`);
            setDebugInfo(prev => `${prev}\nError: ${error.message}`);
            setLoading(false);
        });

        // Consulta de depuración: todos los animales
        const qAllAnimals = query(collection(db, "animals"));
        const unsubscribeAllAnimals = onSnapshot(qAllAnimals, (snapshot) => {
            const allAnimalsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Animal[];
            console.log("Todos los animales en la colección:", allAnimalsData);
            const matchingAnimals = allAnimalsData.filter(animal => animal.farmId === user.farmId);
            console.log("Animales que coinciden con farmId:", matchingAnimals);
            setDebugInfo(prev => `${prev}\nTotal animales en colección: ${allAnimalsData.length}\nCoincidencias con farmId: ${matchingAnimals.length}`);
        }, (error) => {
            console.error("Error al cargar todos los animales:", error.message, { code: error.code });
        });

        return () => {
            unsubscribeAnimals();
            unsubscribeAllAnimals();
        };
    }, [user, router]);

    const renderAnimal = ({ item }: { item: Animal }) => (
        <View style={styles.animalItem}>
            <View style={styles.detailRow}>
                <Icon name="paw" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                <Text style={styles.animalText}>Especie: {item.species} (Importado: {item.isImported ? "Sí" : "No"})</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
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
                <Text style={styles.title}>Importación</Text>
            </View>
            <View style={styles.animalsContainer}>
                <Text style={styles.animalsTitle}>Lista de Animales</Text>
                <Text style={styles.debugText}>{debugInfo}</Text>
                <FlatList
                    data={animals}
                    renderItem={renderAnimal}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyAnimalsText}>No hay animales disponibles para esta finca</Text>}
                />
                {animals.length > 0 && (
                    <TouchableOpacity
                        style={styles.importButton}
                        onPress={() => router.push("/farmManagerMenu/commerce/import/importForm")}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.importButtonText}>Importar Animales</Text>
                    </TouchableOpacity>
                )}
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
    },
    animalsContainer: {
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
    animalsTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 12,
    },
    animalItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.softBrown,
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
    animalText: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginLeft: 8,
    },
    emptyAnimalsText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
        marginTop: 16,
    },
    importButton: {
        backgroundColor: COLORS.forestGreen,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 16,
    },
    importButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.white,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
        marginTop: 20,
    },
    debugText: {
        fontSize: 12,
        color: COLORS.darkGray,
        marginBottom: 8,
        textAlign: "center",
    },
});