import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query, where, writeBatch } from "firebase/firestore";
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
    quantity?: number; // Optional to handle missing quantity
}

export default function ExportForm() {
    const { user } = useAuth();
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
    const [farmName, setFarmName] = useState<string>("Cargando...");
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>("");
    const router = useRouter();

    // Map species to icons
    const getSpeciesIcon = (species: string): string => {
        switch (species.toLowerCase()) {
            case "vaca":
            case "bovino":
                return "cow";
            case "caballo":
                return "horse";
            case "oveja":
                return "sheep";
            case "cerdo":
                return "pig";
            default:
                return "paw";
        }
    };

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
                    setDebugInfo(`Selecciona los animales para exportar:`);
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

        fetchFarmName(user.farmId);

        console.log("Consultando animales para farmId:", user.farmId);

        // Consulta principal: todos los animales para farmId
        const qAnimals = query(
            collection(db, "animals"),
            where("farmId", "==", user.farmId)
        );

        const unsubscribeAnimals = onSnapshot(qAnimals, (snapshot) => {
            const animalsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Animal[];
            console.log("Animales obtenidos:", animalsData);
            // Log animals with missing quantity
            animalsData.forEach(animal => {
                if (animal.quantity === undefined || animal.quantity === null) {
                    console.warn(`Cantidad faltante para animal ID: ${animal.id}, especie: ${animal.species}`);
                }
            });
            setAnimals(animalsData);
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar animales:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar los animales: ${error.message}`);
            setDebugInfo(prev => `${prev}\nError: ${error.message}`);
            setLoading(false);
        });

        // Consulta de depuración: todos los animales en la colección
        const qAllAnimals = query(collection(db, "animals"));
        const unsubscribeAllAnimals = onSnapshot(qAllAnimals, (snapshot) => {
            const allAnimalsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Animal[];
            console.log("Todos los animales en la colección:", allAnimalsData);
        }, (error) => {
            console.error("Error al cargar todos los animales:", error.message, { code: error.code });
        });

        return () => {
            unsubscribeAnimals();
            unsubscribeAllAnimals();
        };
    }, [user, router]);

    // Example: Using farmName in logic outside fetchFarmName
    useEffect(() => {
        if (farmName !== "Cargando...") {
            console.log(`Procesando datos para la finca: ${farmName}`);
            if (farmName === "Finca no encontrada" || farmName === "Error al cargar") {
                console.warn("No se puede guardar: Finca inválida");
            }
        }
    }, [farmName]);

    const toggleAnimalSelection = (animalId: string) => {
        setSelectedAnimalIds(prev =>
            prev.includes(animalId)
                ? prev.filter(id => id !== animalId)
                : [...prev, animalId]
        );
    };

    const handleSubmit = async () => {
        if (selectedAnimalIds.length === 0) {
            Alert.alert("Advertencia", "Por favor, selecciona al menos un animal para importar.");
            return;
        }

        if (farmName === "Finca no encontrada" || farmName === "Error al cargar") {
            Alert.alert("Error", "No se puede guardar: La finca no es válida.");
            return;
        }

        try {
            const batch = writeBatch(db);
            selectedAnimalIds.forEach(animalId => {
                const animalRef = doc(db, "animals", animalId);
                batch.update(animalRef, { isImported: true });
            });

            await batch.commit();
            console.log(`Animales importados para ${farmName}:`, selectedAnimalIds);
            Alert.alert("Éxito", "Los animales seleccionados han sido marcados como importados.");
            router.push("/farmManagerMenu/commerce/export/export");
        } catch (error: any) {
            console.error("Error al importar animales:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron importar los animales: ${error.message}`);
        }
    };

    const renderAnimal = ({ item }: { item: Animal }) => (
        <TouchableOpacity
            style={styles.animalItem}
            onPress={() => toggleAnimalSelection(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.detailRow}>
                <Icon
                    name={selectedAnimalIds.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                    color={COLORS.forestGreen}
                    style={styles.checkboxIcon}
                />
                <Icon
                    name={getSpeciesIcon(item.species)}
                    size={16}
                    color={COLORS.darkGray}
                    style={styles.detailIcon}
                />
                <View>
                <Text style={styles.animalText}>Especie: {item.species}</Text>
                <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                        Cantidad: {item.quantity !== undefined && item.quantity !== null ? item.quantity : "Desconocida"}
                    </Text>
                </View>
                </View>
            </View>
        </TouchableOpacity>
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
                <Icon name="export" size={24} color={COLORS.white} />
                <Text style={styles.title}> Exportar</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>{farmName !== "Cargando..." ? farmName : ""}</Text>
                <View style={styles.debugRow}>
                    <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.debugIcon} />
                    <Text style={styles.debugText}>{debugInfo}</Text>
                </View>
                <FlatList
                    data={animals}
                    renderItem={renderAnimal}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="cow-off" size={40} color={COLORS.softBrown} style={styles.emptyIcon} />
                            <Text style={styles.emptyAnimalsText}>
                                No hay animales disponibles para {farmName !== "Cargando..." ? farmName : "esta finca"}
                            </Text>
                        </View>
                    }
                />
                <TouchableOpacity
                    style={[styles.submitButton, selectedAnimalIds.length === 0 && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.7}
                    disabled={selectedAnimalIds.length === 0}
                >
                    <Icon name="content-save" size={20} color={COLORS.white} style={styles.submitIcon} />
                    <Text style={styles.submitButtonText}>Guardar</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.cream,
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
    },
    debugRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    debugIcon: {
        marginRight: 8,
    },
    debugText: {
        fontSize: 12,
        color: COLORS.darkGray,
        textAlign: "center",
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
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    checkboxIcon: {
        marginRight: 8,
    },
    detailIcon: {
        marginRight: 8,
    },
    quantityIcon: {
        marginRight: 8,
    },
    animalText: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginLeft: 8,
    },
    quantityText: {
        fontSize: 12,
        color: COLORS.darkGray,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 16,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyAnimalsText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
    },
    submitButton: {
        flexDirection: "row",
        backgroundColor: COLORS.forestGreen,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.darkGray,
        opacity: 0.6,
    },
    submitIcon: {
        marginRight: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.white,
    },
    loadingIcon: {
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
    },
});