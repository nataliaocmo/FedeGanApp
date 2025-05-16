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

interface ImportedAnimal {
    id: string;
    species: string;
    breed: string;
    age: number;
    medicalHistory: string;
    status: "Sano" | "Enfermo";
    disease: string | null;
    quantity: number;
    farmId: string;
    importedAt: string;
    origin: string;
}

export default function ImportList() {
    const { user } = useAuth();
    const [importedAnimals, setImportedAnimals] = useState<ImportedAnimal[]>([]);
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
    
            setFarmName("Sin finca");
            setLoading(false);
            return;
        }

        const fetchFarmName = async (farmId: string) => {
            try {
                const farmDocRef = doc(db, "farms", farmId);
                const farmDoc = await getDoc(farmDocRef);
                if (farmDoc.exists()) {
                    const farmData = farmDoc.data();
                    const name = farmData.name || "Finca sin nombre";
                    setFarmName(name);
                    console.log("Nombre de la finca:", name);
                    setDebugInfo(`Has importado los siguientes animales:`);
                } else {
                    console.error("Finca no encontrada para farmId:", farmId);
                    setFarmName("Finca no encontrada");
                    
                }
            } catch (error: any) {
                console.error("Error al cargar nombre de la finca:", error.message, { code: error.code });
                setFarmName("Error al cargar");
               
            }
        };

        fetchFarmName(user.farmId);

        console.log("Consultando animales importados para farmId:", user.farmId);

        const qImportedAnimals = query(
            collection(db, "importedAnimals"),
            where("farmId", "==", user.farmId)
        );

        const unsubscribeImportedAnimals = onSnapshot(qImportedAnimals, (snapshot) => {
            const importedAnimalsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as ImportedAnimal[];
            console.log("Animales importados obtenidos:", importedAnimalsData);
            setImportedAnimals(importedAnimalsData);
            
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar animales importados:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar los animales importados: ${error.message}`);
            
            setLoading(false);
        });

        return () => unsubscribeImportedAnimals();
    }, [user, router]);

    const renderImportedAnimal = ({ item }: { item: ImportedAnimal }) => (
        <View style={styles.animalItem}>
            <View style={styles.detailRow}>
                <Icon name="cow" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                <View>  
                <View style={styles.quantityRow}>
                <Text style={styles.animalText}>
                    <Text style={{ fontWeight: 'bold' }}>Especie: </Text>{item.species}
                    </Text>
                    </View>
                    <View style={styles.quantityRow}>
                        <Text style={styles.animalText}>
                        <Text style={{ fontWeight: 'bold' }}>Raza: </Text>{item.breed}
                        </Text>
                    </View>
                    <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                        <Text style={{ fontWeight: 'bold' }}>Edad: </Text>{item.age} años
                    </Text>
                    </View>
                    <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                        <Text style={{ fontWeight: 'bold' }}>Cantidad: </Text>{item.quantity}
                    </Text>
                    </View>
                    <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                        <Text style={{ fontWeight: 'bold' }}>Estado: </Text>{item.status}
                    </Text>
                    </View>
                    {item.disease && (
                    <View style={styles.quantityRow}>
                        <Text style={styles.quantityText}>
                        <Text style={{ fontWeight: 'bold' }}>Enfermedad: </Text>{item.disease}
                        </Text>
                    </View>
                    )}

                    <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                        <Text style={{ fontWeight: 'bold' }}>Origen: </Text>{item.origin}
                    </Text>
                    </View>
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
                    onPress={() => router.replace("/farmManagerMenu")}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Icon name="import" size={24} color={COLORS.white} />
                <Text style={styles.title}> Importados</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>{farmName !== "Cargando..." ? farmName : ""}</Text>
                <View style={styles.debugRow}>
                    <Text style={styles.debugText}>{debugInfo}</Text>
                </View>
                <FlatList
                    data={importedAnimals}
                    renderItem={renderImportedAnimal}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="cow-off" size={40} color={COLORS.softBrown} style={styles.emptyIcon} />
                            <Text style={styles.emptyAnimalsText}>
                                No hay animales importados para {farmName !== "Cargando..." ? farmName : "esta finca"}
                            </Text>
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
    detailIcon: {
        marginRight: 8,
    },
    quantityIcon: {
        marginRight: 8,
    },
    animalText: {
        fontSize: 12,
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
    loadingIcon: {
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
    },
});