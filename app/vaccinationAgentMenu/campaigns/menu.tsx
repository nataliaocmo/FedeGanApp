import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
    yellow: "#FFB300",
};

interface Outbreak {
    id: string;
    farmId: string;
    latitude: number;
    longitude: number;
    diseases: string[];
    sickAnimalsCount: number;
    createdAt: any;
    createdBy: string;
}

interface Validation {
    outbreakId: string;
    farmId: string;
    isValidated: boolean;
    recommendations: string;
    createdAt: any;
    createdBy: string;
}

// Función para mostrar alertas
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

export default function CampaignMenu() {
    const { user } = useAuth();
    const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
    const [validations, setValidations] = useState<Validation[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "vaccinationAgent") {
            console.error("Acceso denegado: Rol no es vaccinationAgent");
            showAlert("Error", "No tienes permiso para ver esta página.", () => {});
            return;
        }

        // Cargar todos los brotes
        const qOutbreaks = query(collection(db, "outbreaks"));
        const unsubscribeOutbreaks = onSnapshot(qOutbreaks, (snapshot) => {
            const outbreaksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Outbreak[];
            console.log("Brotes cargados:", outbreaksData);
            setOutbreaks(outbreaksData);
        }, (error) => {
            console.error("Error al cargar brotes:", error.message);
            showAlert("Error", "No se pudieron cargar los brotes.", () => {});
        });

        // Cargar validaciones
        const qValidations = query(collection(db, "outbreakValidations"));
        const unsubscribeValidations = onSnapshot(qValidations, (snapshot) => {
            const validationsData = snapshot.docs.map((doc) => ({
                outbreakId: doc.data().outbreakId,
                ...doc.data(),
            })) as Validation[];
            console.log("Validaciones cargadas:", validationsData);
            setValidations(validationsData);
        }, (error) => {
            console.error("Error al cargar validaciones:", error.message);
        });

        return () => {
            unsubscribeOutbreaks();
            unsubscribeValidations();
        };
    }, [user]);

    const handleStartCampaign = (outbreak: Outbreak) => {
        console.log("Navegando a campaigns, outbreakId:", outbreak.id);
        router.push({
            pathname: "/vaccinationAgentMenu/campaigns/campaigns",
            params: { outbreakId: outbreak.id, farmId: outbreak.farmId },
        });
    };

    const renderOutbreak = ({ item }: { item: Outbreak }) => {
        const validation = validations.find((v) => v.outbreakId === item.id);
        const isValidated = validation?.isValidated || false;

        return (
            <View style={styles.outbreakItem}>
                <View style={styles.outbreakContent}>
                    <Text style={styles.outbreakTitle}>
                        Brote: {item.diseases.join(", ")}
                    </Text>
                    <Text style={styles.outbreakDetail}>
                        Finca ID: {item.farmId}
                    </Text>
                    <Text style={styles.outbreakDetail}>
                        Animales afectados: {item.sickAnimalsCount}
                    </Text>
                    <Text style={styles.outbreakDetail}>
                        Estado: {isValidated ? "Validado" : "Pendiente"}
                    </Text>
                    {isValidated && validation && (
                        <Text style={styles.recommendations}>
                            Recomendaciones: {validation.recommendations}
                        </Text>
                    )}
                </View>
                {isValidated && (
                    <TouchableOpacity
                        style={styles.campaignButton}
                        onPress={() => handleStartCampaign(item)}
                        activeOpacity={0.7}
                    >
                        <Icon name="syringe" size={20} color={COLORS.white} />
                        <Text style={styles.buttonText}>Iniciar Campaña</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Brotes Pendientes</Text>
            {outbreaks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={32} color={COLORS.softBrown} />
                    <Text style={styles.emptyText}>No hay brotes pendientes</Text>
                </View>
            ) : (
                <FlatList
                    data={outbreaks}
                    renderItem={renderOutbreak}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
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
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.forestGreen,
        marginBottom: 20,
        textAlign: "center",
    },
    outbreakItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    outbreakContent: {
        marginBottom: 8,
    },
    outbreakTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 4,
    },
    outbreakDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 4,
    },
    recommendations: {
        fontSize: 14,
        color: COLORS.softBrown,
        fontStyle: "italic",
    },
    campaignButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: "center",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "500",
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
});