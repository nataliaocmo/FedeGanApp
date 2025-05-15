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
            <View
                style={[
                    styles.outbreakItem,
                    {
                        borderColor: isValidated ? COLORS.forestGreen : COLORS.yellow,
                        backgroundColor: isValidated
                            ? `${COLORS.forestGreen}10` // Subtle green tint
                            : `${COLORS.yellow}10`, // Subtle yellow tint
                    },
                ]}
            >
                <View style={styles.outbreakContent}>
                    <View style={styles.outbreakHeader}>
                        <Icon name="alert-circle-outline" size={20} color={COLORS.forestGreen} style={styles.icon} />
                        <Text style={styles.outbreakTitle}>
                            {item.diseases.join(", ")}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.outbreakDetail}>Finca ID: {item.farmId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="paw" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.outbreakDetail}>Animales afectados: {item.sickAnimalsCount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon
                            name={isValidated ? "check-circle-outline" : "clock-outline"}
                            size={16}
                            color={isValidated ? COLORS.darkGray : COLORS.darkGray}
                            style={styles.detailIcon}
                        />
                        <Text style={styles.outbreakDetail}>Estado: {isValidated ? "Validado" : "Pendiente"}</Text>
                    </View>
                    {isValidated && validation && (
                        <View style={styles.recommendationsContainer}>
                            <Icon name="note-text-outline" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                            <Text style={styles.recommendations}>Recomendaciones: {validation.recommendations}</Text>
                        </View>
                    )}
                </View>
                {isValidated && (
                    <TouchableOpacity
                        style={styles.campaignButton}
                        onPress={() => handleStartCampaign(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>Iniciar Campaña</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {outbreaks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={48} color={COLORS.softBrown} />
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
        paddingVertical: 20,
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
        borderWidth: 2, // Added for visible border
    },
    outbreakContent: {
        marginBottom: 12,
    },
    outbreakHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    icon: {
        marginRight: 8,
    },
    outbreakTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    detailIcon: {
        marginRight: 8,
    },
    outbreakDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
    },
    recommendationsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 4,
    },
    recommendations: {
        fontSize: 14,
        color: COLORS.darkGray,
        fontStyle: "italic",
        flex: 1,
        fontWeight: "600"
    },
    campaignButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: "center",
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
        fontSize: 14,
        fontWeight: "600",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.softBrown,
        textAlign: "center",
        marginTop: 12,
        fontWeight: "500",
    },
    listContainer: {
        paddingBottom: 20,
    },
});